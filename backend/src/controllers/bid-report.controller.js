import mongoose from 'mongoose';
import Bid from '../models/Bid.model.js';
import Item from '../models/Item.model.js';
import BuyerRegister from '../models/BuyerRegister.model.js';
import SellerRegister from '../models/SellerRegister.model.js';

// Generate comprehensive bidding report
export const generateBiddingReport = async (req, res) => {
    try {
        const { startDate, endDate, sellerEmail, buyerEmail, itemId, reportType = 'comprehensive' } = req.query;

        // Check if database is connected
        if (mongoose.connection.readyState !== 1) {
            return res.json({
                success: true,
                reportType,
                generatedAt: new Date().toISOString(),
                filters: { startDate, endDate, sellerEmail, buyerEmail, itemId },
                message: 'Database not connected - showing sample data',
                data: getSampleReportData(reportType),
                stats: getSampleStats()
            });
        }

        // Build filter conditions
        const filter = {};
        if (startDate || endDate) {
            filter.createdAt = {};
            if (startDate) filter.createdAt.$gte = new Date(startDate);
            if (endDate) filter.createdAt.$lte = new Date(endDate);
        }

        // Get all bids with populated data
        const bids = await Bid.find(filter)
            .populate('itemId', 'name fishType quality startingPrice currentPrice status sellerName')
            .sort({ createdAt: -1 });

        // Filter by additional criteria
        let filteredBids = bids;
        if (sellerEmail) {
            filteredBids = filteredBids.filter(bid => 
                bid.itemId?.sellerName?.toLowerCase().includes(sellerEmail.toLowerCase()) ||
                bid.itemId?.sellerEmail === sellerEmail
            );
        }
        if (buyerEmail) {
            filteredBids = filteredBids.filter(bid => 
                bid.userName?.toLowerCase().includes(buyerEmail.toLowerCase()) ||
                bid.userId?.email === buyerEmail
            );
        }
        if (itemId) {
            filteredBids = filteredBids.filter(bid => bid.itemId?._id.toString() === itemId);
        }

        // Calculate statistics
        const stats = calculateBiddingStats(filteredBids);

        // Generate different report types
        let reportData;
        switch (reportType) {
            case 'summary':
                reportData = generateSummaryReport(filteredBids, stats);
                break;
            case 'user-analysis':
                reportData = generateUserAnalysisReport(filteredBids, stats);
                break;
            case 'item-performance':
                reportData = generateItemPerformanceReport(filteredBids, stats);
                break;
            case 'seller-performance':
                reportData = generateSellerPerformanceReport(filteredBids, stats);
                break;
            default:
                reportData = generateComprehensiveReport(filteredBids, stats);
        }

        res.json({
            success: true,
            reportType,
            generatedAt: new Date().toISOString(),
            filters: { startDate, endDate, sellerEmail, buyerEmail, itemId },
            data: reportData,
            stats
        });

    } catch (error) {
        console.error('Error generating bidding report:', error);
        res.status(500).json({ 
            success: false, 
            error: 'Failed to generate bidding report',
            details: error.message 
        });
    }
};

// Calculate bidding statistics
const calculateBiddingStats = (bids) => {
    if (!bids || bids.length === 0) {
        return {
            totalBids: 0,
            totalBidders: 0,
            totalItems: 0,
            totalValue: 0,
            averageBidAmount: 0,
            highestBid: 0,
            lowestBid: 0,
            activeAuctions: 0,
            completedAuctions: 0
        };
    }

    const bidAmounts = bids.map(bid => bid.bidAmount).filter(amount => amount > 0);
    const uniqueBidders = new Set(bids.map(bid => bid.userId?.toString() || bid.userName));
    const uniqueItems = new Set(bids.map(bid => bid.itemId?._id?.toString()));
    const activeItems = new Set(bids.filter(bid => bid.itemId?.status === 'open').map(bid => bid.itemId?._id?.toString()));
    const completedItems = new Set(bids.filter(bid => bid.itemId?.status === 'closed').map(bid => bid.itemId?._id?.toString()));

    return {
        totalBids: bids.length,
        totalBidders: uniqueBidders.size,
        totalItems: uniqueItems.size,
        totalValue: bidAmounts.reduce((sum, amount) => sum + amount, 0),
        averageBidAmount: bidAmounts.length > 0 ? bidAmounts.reduce((sum, amount) => sum + amount, 0) / bidAmounts.length : 0,
        highestBid: Math.max(...bidAmounts, 0),
        lowestBid: Math.min(...bidAmounts, 0),
        activeAuctions: activeItems.size,
        completedAuctions: completedItems.size
    };
};

// Generate comprehensive report
const generateComprehensiveReport = (bids, stats) => {
    const dailyBids = {};
    const itemBids = {};
    const userBids = {};

    // Group bids by day, item, and user
    bids.forEach(bid => {
        const date = new Date(bid.createdAt).toISOString().split('T')[0];
        const itemId = bid.itemId?._id?.toString();
        const userId = bid.userId?._id?.toString() || bid.userName;

        // Daily bids
        if (!dailyBids[date]) dailyBids[date] = [];
        dailyBids[date].push(bid);

        // Item bids
        if (itemId) {
            if (!itemBids[itemId]) {
                itemBids[itemId] = {
                    item: bid.itemId,
                    bids: [],
                    totalBids: 0,
                    totalValue: 0,
                    highestBid: 0,
                    uniqueBidders: new Set()
                };
            }
            itemBids[itemId].bids.push(bid);
            itemBids[itemId].totalBids++;
            itemBids[itemId].totalValue += bid.bidAmount;
            itemBids[itemId].highestBid = Math.max(itemBids[itemId].highestBid, bid.bidAmount);
            itemBids[itemId].uniqueBidders.add(userId);
        }

        // User bids
        if (userId) {
            if (!userBids[userId]) {
                userBids[userId] = {
                    user: bid.userId || { name: bid.userName },
                    bids: [],
                    totalBids: 0,
                    totalValue: 0,
                    uniqueItems: new Set(),
                    averageBidAmount: 0
                };
            }
            userBids[userId].bids.push(bid);
            userBids[userId].totalBids++;
            userBids[userId].totalValue += bid.bidAmount;
            if (itemId) userBids[userId].uniqueItems.add(itemId);
        }
    });

    // Calculate user averages
    Object.values(userBids).forEach(user => {
        user.averageBidAmount = user.totalBids > 0 ? user.totalValue / user.totalBids : 0;
        user.uniqueItemsCount = user.uniqueItems.size;
        delete user.uniqueItems; // Remove Set from JSON
    });

    // Calculate item averages
    Object.values(itemBids).forEach(item => {
        item.uniqueBiddersCount = item.uniqueBidders.size;
        item.averageBidAmount = item.totalBids > 0 ? item.totalValue / item.totalBids : 0;
        delete item.uniqueBidders; // Remove Set from JSON
    });

    return {
        dailyBreakdown: Object.entries(dailyBids).map(([date, dateBids]) => ({
            date,
            totalBids: dateBids.length,
            totalValue: dateBids.reduce((sum, bid) => sum + bid.bidAmount, 0),
            uniqueBidders: new Set(dateBids.map(bid => bid.userId?.toString() || bid.userName)).size,
            uniqueItems: new Set(dateBids.map(bid => bid.itemId?._id?.toString())).size
        })),
        itemPerformance: Object.values(itemBids).sort((a, b) => b.totalBids - a.totalBids),
        userActivity: Object.values(userBids).sort((a, b) => b.totalBids - a.totalBids),
        recentBids: bids.slice(0, 20).map(bid => ({
            id: bid._id,
            itemName: bid.itemId?.name,
            fishType: bid.itemId?.fishType,
            bidderName: bid.userName || bid.userId?.name,
            bidAmount: bid.bidAmount,
            createdAt: bid.createdAt,
            itemStatus: bid.itemId?.status
        }))
    };
};

// Generate summary report
const generateSummaryReport = (bids, stats) => {
    const topBidders = {};
    const topItems = {};

    bids.forEach(bid => {
        const userId = bid.userId?._id?.toString() || bid.userName;
        const itemId = bid.itemId?._id?.toString();

        if (userId) {
            if (!topBidders[userId]) {
                topBidders[userId] = {
                    name: bid.userName || bid.userId?.name,
                    totalBids: 0,
                    totalValue: 0
                };
            }
            topBidders[userId].totalBids++;
            topBidders[userId].totalValue += bid.bidAmount;
        }

        if (itemId) {
            if (!topItems[itemId]) {
                topItems[itemId] = {
                    name: bid.itemId?.name,
                    fishType: bid.itemId?.fishType,
                    totalBids: 0,
                    highestBid: 0,
                    status: bid.itemId?.status
                };
            }
            topItems[itemId].totalBids++;
            topItems[itemId].highestBid = Math.max(topItems[itemId].highestBid, bid.bidAmount);
        }
    });

    return {
        topBidders: Object.values(topBidders).sort((a, b) => b.totalBids - a.totalBids).slice(0, 10),
        topItems: Object.values(topItems).sort((a, b) => b.totalBids - a.totalBids).slice(0, 10),
        recentActivity: bids.slice(0, 10).map(bid => ({
            itemName: bid.itemId?.name,
            bidderName: bid.userName,
            bidAmount: bid.bidAmount,
            createdAt: bid.createdAt
        }))
    };
};

// Generate user analysis report
const generateUserAnalysisReport = (bids, stats) => {
    const userAnalysis = {};

    bids.forEach(bid => {
        const userId = bid.userId?._id?.toString() || bid.userName;
        if (!userId) return;

        if (!userAnalysis[userId]) {
            userAnalysis[userId] = {
                user: bid.userId || { name: bid.userName },
                bids: [],
                totalBids: 0,
                totalValue: 0,
                uniqueItems: new Set(),
                bidFrequency: {},
                averageBidAmount: 0,
                biddingPattern: 'regular'
            };
        }

        const user = userAnalysis[userId];
        user.bids.push(bid);
        user.totalBids++;
        user.totalValue += bid.bidAmount;
        
        const itemId = bid.itemId?._id?.toString();
        if (itemId) user.uniqueItems.add(itemId);

        // Track bidding frequency by day
        const date = new Date(bid.createdAt).toISOString().split('T')[0];
        user.bidFrequency[date] = (user.bidFrequency[date] || 0) + 1;
    });

    // Calculate patterns and averages
    Object.values(userAnalysis).forEach(user => {
        user.averageBidAmount = user.totalBids > 0 ? user.totalValue / user.totalBids : 0;
        user.uniqueItemsCount = user.uniqueItems.size;
        delete user.uniqueItems;

        // Determine bidding pattern
        const frequencies = Object.values(user.bidFrequency);
        const avgFrequency = frequencies.reduce((sum, freq) => sum + freq, 0) / frequencies.length;
        if (avgFrequency > 5) user.biddingPattern = 'aggressive';
        else if (avgFrequency > 2) user.biddingPattern = 'moderate';
        else user.biddingPattern = 'conservative';
    });

    return {
        userProfiles: Object.values(userAnalysis).sort((a, b) => b.totalBids - a.totalBids),
        biddingPatterns: {
            aggressive: Object.values(userAnalysis).filter(u => u.biddingPattern === 'aggressive').length,
            moderate: Object.values(userAnalysis).filter(u => u.biddingPattern === 'moderate').length,
            conservative: Object.values(userAnalysis).filter(u => u.biddingPattern === 'conservative').length
        }
    };
};

// Generate item performance report
const generateItemPerformanceReport = (bids, stats) => {
    const itemPerformance = {};

    bids.forEach(bid => {
        const itemId = bid.itemId?._id?.toString();
        if (!itemId) return;

        if (!itemPerformance[itemId]) {
            itemPerformance[itemId] = {
                item: bid.itemId,
                bids: [],
                totalBids: 0,
                totalValue: 0,
                uniqueBidders: new Set(),
                highestBid: 0,
                lowestBid: Infinity,
                averageBidAmount: 0,
                biddingIntensity: 'low'
            };
        }

        const item = itemPerformance[itemId];
        item.bids.push(bid);
        item.totalBids++;
        item.totalValue += bid.bidAmount;
        item.highestBid = Math.max(item.highestBid, bid.bidAmount);
        item.lowestBid = Math.min(item.lowestBid, bid.bidAmount);

        const userId = bid.userId?._id?.toString() || bid.userName;
        if (userId) item.uniqueBidders.add(userId);
    });

    // Calculate averages and intensity
    Object.values(itemPerformance).forEach(item => {
        item.averageBidAmount = item.totalBids > 0 ? item.totalValue / item.totalBids : 0;
        item.uniqueBiddersCount = item.uniqueBidders.size;
        delete item.uniqueBidders;

        // Determine bidding intensity
        if (item.totalBids > 20) item.biddingIntensity = 'high';
        else if (item.totalBids > 10) item.biddingIntensity = 'medium';
        else item.biddingIntensity = 'low';
    });

    return {
        itemAnalysis: Object.values(itemPerformance).sort((a, b) => b.totalBids - a.totalBids),
        intensityDistribution: {
            high: Object.values(itemPerformance).filter(i => i.biddingIntensity === 'high').length,
            medium: Object.values(itemPerformance).filter(i => i.biddingIntensity === 'medium').length,
            low: Object.values(itemPerformance).filter(i => i.biddingIntensity === 'low').length
        }
    };
};

// Generate seller performance report
const generateSellerPerformanceReport = (bids, stats) => {
    const sellerPerformance = {};

    bids.forEach(bid => {
        const sellerEmail = bid.itemId?.sellerEmail;
        const sellerName = bid.itemId?.sellerName;
        if (!sellerEmail && !sellerName) return;

        const sellerKey = sellerEmail || sellerName;
        if (!sellerPerformance[sellerKey]) {
            sellerPerformance[sellerKey] = {
                sellerName,
                sellerEmail,
                items: new Set(),
                totalBids: 0,
                totalValue: 0,
                averageBidsPerItem: 0,
                performance: 'average'
            };
        }

        const seller = sellerPerformance[sellerKey];
        seller.totalBids++;
        seller.totalValue += bid.bidAmount;
        
        const itemId = bid.itemId?._id?.toString();
        if (itemId) seller.items.add(itemId);
    });

    // Calculate performance metrics
    Object.values(sellerPerformance).forEach(seller => {
        seller.uniqueItemsCount = seller.items.size;
        seller.averageBidsPerItem = seller.uniqueItemsCount > 0 ? seller.totalBids / seller.uniqueItemsCount : 0;
        delete seller.items;

        // Determine performance level
        if (seller.averageBidsPerItem > 15) seller.performance = 'excellent';
        else if (seller.averageBidsPerItem > 8) seller.performance = 'good';
        else if (seller.averageBidsPerItem > 3) seller.performance = 'average';
        else seller.performance = 'needs_improvement';
    });

    return {
        sellerAnalysis: Object.values(sellerPerformance).sort((a, b) => b.totalBids - a.totalBids),
        performanceDistribution: {
            excellent: Object.values(sellerPerformance).filter(s => s.performance === 'excellent').length,
            good: Object.values(sellerPerformance).filter(s => s.performance === 'good').length,
            average: Object.values(sellerPerformance).filter(s => s.performance === 'average').length,
            needs_improvement: Object.values(sellerPerformance).filter(s => s.performance === 'needs_improvement').length
        }
    };
};

// Get available report filters
export const getReportFilters = async (req, res) => {
    try {
        // Check if database is connected
        if (mongoose.connection.readyState !== 1) {
            return res.json({
                success: true,
                filters: {
                    sellers: [
                        { name: 'Ocean Fresh Fisheries', email: 'ocean@fisheries.com' },
                        { name: 'Coastal Catch Co.', email: 'coastal@catch.com' },
                        { name: 'Deep Sea Traders', email: 'deepsea@traders.com' }
                    ],
                    buyers: [
                        { name: 'John Smith', email: 'john@email.com' },
                        { name: 'Sarah Johnson', email: 'sarah@email.com' },
                        { name: 'Mike Wilson', email: 'mike@email.com' }
                    ],
                    items: [
                        { _id: 'sample1', name: 'Fresh Tuna Catch', fishType: 'Tuna', sellerName: 'Ocean Fresh Fisheries' },
                        { _id: 'sample2', name: 'Premium Salmon', fishType: 'Salmon', sellerName: 'Coastal Catch Co.' },
                        { _id: 'sample3', name: 'Fresh Lobster', fishType: 'Lobster', sellerName: 'Deep Sea Traders' }
                    ]
                }
            });
        }

        const sellers = await SellerRegister.find({}, 'name email').limit(50);
        const buyers = await BuyerRegister.find({}, 'name email').limit(50);
        const items = await Item.find({}, 'name fishType sellerName').limit(50);

        res.json({
            success: true,
            filters: {
                sellers: sellers.map(s => ({ name: s.name, email: s.email })),
                buyers: buyers.map(b => ({ name: b.name, email: b.email })),
                items: items.map(i => ({ 
                    _id: i._id, 
                    name: i.name, 
                    fishType: i.fishType, 
                    sellerName: i.sellerName 
                }))
            }
        });
    } catch (error) {
        console.error('Error getting report filters:', error);
        res.status(500).json({ 
            success: false, 
            error: 'Failed to get report filters',
            details: error.message 
        });
    }
};

// Sample data functions for when database is not connected
const getSampleStats = () => ({
    totalBids: 156,
    totalBidders: 23,
    totalItems: 45,
    totalValue: 1250000,
    averageBidAmount: 8012.82,
    highestBid: 45000,
    lowestBid: 500,
    activeAuctions: 12,
    completedAuctions: 33
});

const getSampleReportData = (reportType) => {
    const sampleBids = [
        {
            itemName: 'Fresh Tuna Catch',
            fishType: 'Tuna',
            bidderName: 'John Smith',
            bidAmount: 25000,
            createdAt: new Date().toISOString(),
            itemStatus: 'open'
        },
        {
            itemName: 'Premium Salmon',
            fishType: 'Salmon',
            bidderName: 'Sarah Johnson',
            bidAmount: 18000,
            createdAt: new Date(Date.now() - 86400000).toISOString(),
            itemStatus: 'closed'
        },
        {
            itemName: 'Fresh Lobster',
            fishType: 'Lobster',
            bidderName: 'Mike Wilson',
            bidAmount: 32000,
            createdAt: new Date(Date.now() - 172800000).toISOString(),
            itemStatus: 'open'
        }
    ];

    switch (reportType) {
        case 'summary':
            return {
                topBidders: [
                    { name: 'John Smith', totalBids: 15, totalValue: 125000 },
                    { name: 'Sarah Johnson', totalBids: 12, totalValue: 98000 },
                    { name: 'Mike Wilson', totalBids: 8, totalValue: 75000 }
                ],
                topItems: [
                    { name: 'Fresh Tuna Catch', fishType: 'Tuna', totalBids: 25, highestBid: 45000, status: 'open' },
                    { name: 'Premium Salmon', fishType: 'Salmon', totalBids: 18, highestBid: 28000, status: 'closed' },
                    { name: 'Fresh Lobster', fishType: 'Lobster', totalBids: 12, highestBid: 35000, status: 'open' }
                ],
                recentActivity: sampleBids
            };
        
        case 'user-analysis':
            return {
                userProfiles: [
                    { user: { name: 'John Smith' }, totalBids: 15, totalValue: 125000, uniqueItemsCount: 8, averageBidAmount: 8333.33, biddingPattern: 'aggressive' },
                    { user: { name: 'Sarah Johnson' }, totalBids: 12, totalValue: 98000, uniqueItemsCount: 6, averageBidAmount: 8166.67, biddingPattern: 'moderate' },
                    { user: { name: 'Mike Wilson' }, totalBids: 8, totalValue: 75000, uniqueItemsCount: 4, averageBidAmount: 9375, biddingPattern: 'conservative' }
                ],
                biddingPatterns: { aggressive: 8, moderate: 10, conservative: 5 }
            };
        
        case 'item-performance':
            return {
                itemAnalysis: [
                    { item: { name: 'Fresh Tuna Catch', fishType: 'Tuna' }, totalBids: 25, uniqueBiddersCount: 12, highestBid: 45000, averageBidAmount: 18500, biddingIntensity: 'high' },
                    { item: { name: 'Premium Salmon', fishType: 'Salmon' }, totalBids: 18, uniqueBiddersCount: 8, highestBid: 28000, averageBidAmount: 15500, biddingIntensity: 'medium' },
                    { item: { name: 'Fresh Lobster', fishType: 'Lobster' }, totalBids: 12, uniqueBiddersCount: 6, highestBid: 35000, averageBidAmount: 22000, biddingIntensity: 'medium' }
                ],
                intensityDistribution: { high: 15, medium: 20, low: 10 }
            };
        
        case 'seller-performance':
            return {
                sellerAnalysis: [
                    { sellerName: 'Ocean Fresh Fisheries', totalBids: 45, totalValue: 380000, uniqueItemsCount: 8, averageBidsPerItem: 5.6, performance: 'excellent' },
                    { sellerName: 'Coastal Catch Co.', totalBids: 32, totalValue: 265000, uniqueItemsCount: 6, averageBidsPerItem: 5.3, performance: 'good' },
                    { sellerName: 'Deep Sea Traders', totalBids: 28, totalValue: 220000, uniqueItemsCount: 5, averageBidsPerItem: 5.6, performance: 'good' }
                ],
                performanceDistribution: { excellent: 3, good: 8, average: 12, needs_improvement: 2 }
            };
        
        default: // comprehensive
            return {
                dailyBreakdown: [
                    { date: new Date().toISOString().split('T')[0], totalBids: 12, totalValue: 85000, uniqueBidders: 8, uniqueItems: 5 },
                    { date: new Date(Date.now() - 86400000).toISOString().split('T')[0], totalBids: 18, totalValue: 125000, uniqueBidders: 12, uniqueItems: 7 },
                    { date: new Date(Date.now() - 172800000).toISOString().split('T')[0], totalBids: 15, totalValue: 98000, uniqueBidders: 9, uniqueItems: 6 }
                ],
                recentBids: sampleBids,
                itemPerformance: [
                    { item: { name: 'Fresh Tuna Catch', fishType: 'Tuna' }, totalBids: 25, totalValue: 462500, uniqueBiddersCount: 12, highestBid: 45000, averageBidAmount: 18500 }
                ],
                userActivity: [
                    { user: { name: 'John Smith' }, totalBids: 15, totalValue: 125000, uniqueItemsCount: 8, averageBidAmount: 8333.33 }
                ]
            };
    }
};

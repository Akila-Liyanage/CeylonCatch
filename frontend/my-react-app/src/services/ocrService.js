import Tesseract from 'tesseract.js';

export const scanReceipt = async (imageFile) => {
    try {
        const { data: { text } } = await Tesseract.recognize(
            imageFile,
            'eng',
            {
                logger: m => console.log(m)
            }
        );

        // Extract data using simple regex patterns
        const extractedData = extractDataFromText(text);
        return extractedData;
    } catch (error) {
        console.error('OCR Error:', error);
        throw new Error('Failed to scan receipt');
    }
};

const extractDataFromText = (text) => {
    const data = {
        amount: null,
        date: null,
        description: '',
        category: '',
        invoiceNumber: ''
    };

    // Extract amount - look for currency patterns with better filtering
    const currencyPatterns = [
        // Look for amounts with currency symbols
        /\$[\s]*(\d+(?:,\d{3})*(?:\.\d{2})?)/g,
        /LKR[\s]*(\d+(?:,\d{3})*(?:\.\d{2})?)/g,
        /Rs\.?[\s]*(\d+(?:,\d{3})*(?:\.\d{2})?)/g,
        // Look for amounts with decimal places (more likely to be money)
        /(\d+(?:,\d{3})*\.\d{2})/g,
        // Look for "Total:" or "Amount:" followed by numbers
        /(?:Total|Amount|Subtotal)[:\s]*[\$LKR\s]*(\d+(?:,\d{3})*(?:\.\d{2})?)/gi
    ];

    let allAmounts = [];

    currencyPatterns.forEach(pattern => {
        const matches = text.match(pattern);
        if (matches) {
            matches.forEach(match => {
                const num = match.replace(/[^\d.,]/g, '');
                const amount = parseFloat(num.replace(/,/g, ''));
                if (!isNaN(amount) && amount > 0) {
                    allAmounts.push(amount);
                }
            });
        }
    });

    // Filter out likely non-monetary numbers (postal codes, quantities, etc.)
    const filteredAmounts = allAmounts.filter(amount => {
        // Exclude very small amounts (likely quantities or percentages)
        if (amount < 10) return false;
        // Exclude amounts that are too large (likely postal codes or IDs)
        if (amount > 100000) return false;
        // Prefer amounts with decimal places (more likely to be money)
        return true;
    });

    if (filteredAmounts.length > 0) {
        // Sort by amount and take the largest reasonable amount
        filteredAmounts.sort((a, b) => b - a);
        data.amount = filteredAmounts[0];
        console.log('Extracted amounts:', allAmounts);
        console.log('Filtered amounts:', filteredAmounts);
        console.log('Selected amount:', data.amount);
    }

    // Extract date (look for date patterns with better context)
    const datePatterns = [
        // Look for "Invoice date:" or "Date:" followed by date
        /(?:Invoice date|Date|Due date)[:\s]*(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4})/gi,
        // Look for common date formats
        /(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{4})/g,
        // Look for month name patterns
        /(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s+\d{1,2},?\s+\d{4}/gi
    ];

    let foundDate = null;
    datePatterns.forEach(pattern => {
        const matches = text.match(pattern);
        if (matches && !foundDate) {
            foundDate = matches[0];
        }
    });

    if (foundDate) {
        data.date = foundDate;
    }

    // Extract invoice number
    const invoicePatterns = [
        // Look for "Invoice number:" or "Invoice #:" followed by invoice number
        /(?:Invoice number|Invoice #|Invoice No|Invoice ID)[:\s]*([A-Z0-9\-/]+)/gi,
        // Look for common invoice number patterns with slashes and hyphens
        /(?:INV|INV-|Invoice)[\s]*([A-Z0-9\-/]+)/gi,
        // Look for patterns like SLT21-22/0001, INV-2024/001, etc.
        /([A-Z]{2,4}\d{2,4}[\-][A-Z0-9]+[\/][A-Z0-9]+)/gi,
        // Look for patterns like SLT21-22/0001 specifically
        /([A-Z]{3}\d{2}[\-]\d{2}[\/]\d{4})/gi,
        // Look for any alphanumeric pattern with hyphens and slashes
        /([A-Z]{2,4}[\-]?[A-Z0-9]+[\/]?[A-Z0-9]+)/gi,
        // Look for patterns that start with letters and contain numbers, hyphens, slashes
        /([A-Z]{2,4}[\d\-/]+)/gi
    ];

    let foundInvoiceNumber = '';
    let allMatches = [];

    invoicePatterns.forEach(pattern => {
        const matches = text.match(pattern);
        if (matches) {
            matches.forEach(match => {
                // Clean up the match to get just the invoice number
                const invoiceMatch = match.match(/([A-Z0-9\-/]+)/);
                if (invoiceMatch) {
                    allMatches.push(invoiceMatch[1]);
                }
            });
        }
    });

    // Filter out false positives
    const filteredMatches = allMatches.filter(match => {
        // Exclude phone numbers (10+ digits)
        if (/^\d{10,}$/.test(match)) return false;
        // Exclude GSTIN numbers (15 digits)
        if (/^\d{15}$/.test(match)) return false;
        // Exclude pure numbers
        if (/^\d+$/.test(match)) return false;
        // Must contain at least one letter
        if (!/[A-Z]/.test(match)) return false;
        // Must be reasonable length (not too short or too long)
        if (match.length < 4 || match.length > 20) return false;
        return true;
    });

    if (filteredMatches.length > 0) {
        // Prefer matches that contain slashes and hyphens (more likely to be invoice numbers)
        const preferredMatch = filteredMatches.find(match => /[\/\-]/.test(match)) || filteredMatches[0];
        foundInvoiceNumber = preferredMatch;
        console.log('All invoice matches found:', allMatches);
        console.log('Filtered invoice matches:', filteredMatches);
        console.log('Selected invoice number:', foundInvoiceNumber);
    }

    if (foundInvoiceNumber) {
        data.invoiceNumber = foundInvoiceNumber;
        console.log('Extracted invoice number:', foundInvoiceNumber);
    }



    console.log('Final extracted data:', data);
    return data;
};

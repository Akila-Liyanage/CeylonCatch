export const bidSocketHandler = (io, socket) => {
    //Listen for bid placement
    socket.on('placeBid', (data) => {
        console.log("Bid received:", data);
        //Broadcast the new bid to all connected clients
        io.emit('newBid', data);
    });
};
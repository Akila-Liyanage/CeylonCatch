import React, { useEffect, useState } from 'react'
import { useParams } from "react-router";
import axios from "axios";
import io from "socket.io-client";
import './itemDetails.css';

const socket = io("http://localhost:5000");


const ItemDetails = () => {

    const { id } = useParams();
    const [item, setItem] = useState(null);
    const [bidAmount, setBidAmount] = useState("");

    useEffect(() => {
        axios.get(`http://localhost:5000/api/items/${id}`)
        .then(res => setItem(res.data))
        .catch(err => console.error(err));

         socket.on("bidUpdate", (data) => {
        if(data.itemId === id){
            setItem(prev => ({
                ...prev,
                currentPrice: data.currentPrice,
            }));
        }
    });

    return () => {
        socket.off("bidUpdate");
    };
    }, [id]);

    const handleBid = () => {
        if(parseFloat(bidAmount) > item.currentPrice){
            socket.emit("placeBid", {
                itemId : id,
                amount: bidAmount,
                userId: "DemoUser" // replace with real logged user
            });
            setBidAmount("");
        }else{
            alert("Bid must be higher than current price!");
        }
    };

    if(!item) return <p>Loading...</p>


  return (
    <div className='itemDetails'>
        <img src={item.image} alt={item.name} width="300" height="300"/>
        <h2>{item.name}</h2>
        <p>item.description</p>
        <p><b>Starting Price:</b> Rs.{item.startingPrice}</p>
        <p><b>Current Price:</b> {item.currentPrice}</p>
        <p><b>Status:</b> {item.status}</p>
        <p><b>Auction Ends:</b> {new Date(item.endTime).toLocaleString()}</p>

        {item.status === "open" ? (
            <div className="bid-box">
                <input 
                type='number'
                placeholder='Enter bid amount'
                value={bidAmount}
                onChange={(e) => setBidAmount(e.target.value)}
                 />
                 <button onClick={handleBid}>Place Bid</button>
            </div>
        ) : (
            <p>Auction Closed</p>
        )}
    </div>
  )
}

export default ItemDetails
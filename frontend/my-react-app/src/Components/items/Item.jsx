// ...existing code...
import React, { useState, useEffect } from 'react';
import axios from 'axios';

const Item = () => {
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);

    // Fetch items when component loads
    useEffect(() => {
        const fetchItems = async () => {
            try {
                const res = await axios.get('http://localhost:5000/api/items');
                console.log(res.data);
                setItems(res.data || res.data.items);
                console.log("first")
            } catch (err) {
                console.error('Error fetching items:', err);
            } finally {
                setLoading(false);
            }
        };
        fetchItems();
    }, []);

    if (loading) {
        return <div>Loading items...</div>;
    }


    return (
        <div>
            <div className="itemContainer">
                {items.length > 0 ? (
                    items.map((item) => (
                        <div key={item._id} className="itemCard">
                            <h3>{item.name}</h3>
                            <p>{item.description}</p>
                            <p>Starting Price: ${item.startingPrice}</p>
                            <p>Current Price: ${item.currentPrice}</p>
                            <p>Status: {item.status}</p>
                        </div>
                    ))
                ) : (
                    <p>No items available</p>
                )}
            </div>
        </div>
    );
};

export default Item;
//
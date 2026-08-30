import React, { useContext } from 'react'
import "./FoodDisplay.css"
import { StoreContext } from '../../context/StoreContext'
import FoodItem from '../FoodItem/FoodItem'

const FoodDisplay = ({ category }) => {
  const { food_list, loading } = useContext(StoreContext)

  const filteredFoods = food_list.filter((item) => {
    if (category === "All") return true;
    return item.category_name === category;
  });

  if (loading) {
    return (
      <div className='food-display' id='food-display'>
        <h2>Top Dishes Near You</h2>
        <div className="food-display-loading">
          <p>Loading delicious food...</p>
        </div>
      </div>
    )
  }

  return (
    <div className='food-display' id='food-display'>
      <h2>Top Dishes Near You</h2>
      <div className="food-display-list">
        {filteredFoods.map((item) => (
          <FoodItem
            key={item.id}
            id={item.id}
            name={item.name}
            description={item.description}
            price={item.price}
            image={item.image}
            preparation_time={item.preparation_time}
            is_featured={item.is_featured}
          />
        ))}
      </div>
    </div>
  )
}

export default FoodDisplay

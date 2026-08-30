import React, { useContext } from 'react'
import "./ExploreMenu.css"
import { StoreContext } from '../../context/StoreContext'

const ExploreMenu = ({ category, setCategory }) => {
  const { categories, getImageUrl } = useContext(StoreContext);
  return (
    <div className='explore-menu' id='explore-menu'>
      <h1>Explore our menu</h1>
      <p className='explore-menu-text'>Choose from a diverse menu featuring a delectable array of dishes. Our mission is to satisfy your craving and elevate your dining experience, one delicious meal at a time.</p>
      <div className="explore-menu-list">
        <div
          onClick={() => setCategory("All")}
          key="all"
          className="explore-menu-list-item"
        >
          <div className={category === "All" ? "active" : ""} style={{ width: '7.5vw', minWidth: 80, height: '7.5vw', minHeight: 80, borderRadius: '50%', backgroundColor: '#f0f0f0', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '24px', fontWeight: 'bold', color: 'tomato' }}>
            All
          </div>
          <p>All</p>
        </div>
        {categories.map((item) => {
          return (
            <div onClick={() => setCategory(prev => prev === item.name ? "All" : item.name)} key={item.id} className="explore-menu-list-item">
              <img className={category === item.name ? "active" : ""} src={getImageUrl(item.image)} alt="" />
              <p>{item.name}</p>
            </div>
          )
        })}
      </div>
      <hr />
    </div>
  )
}

export default ExploreMenu

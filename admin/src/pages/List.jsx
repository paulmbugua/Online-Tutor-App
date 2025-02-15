import axios from 'axios';
import React, { useEffect, useState } from 'react';
import { backendUrl, currency } from '../App';
import { toast } from 'react-toastify';

const List = ({ token }) => {
  const [list, setList] = useState([]);
  const [editingProduct, setEditingProduct] = useState(null);
  const [updatedData, setUpdatedData] = useState({
    name: '',
    category: 'Boys',
    subCategory: 'Topwear',
    new_price: '',
    old_price: '',
    bestseller: false,
    images: [],  // Array for image URLs or files
    description: '',
    ageGroup: [],  // Changed from 'ages' to 'ageGroup'
});


  const fetchList = async () => {
    try {
      const response = await axios.get(`${backendUrl}/api/product/list`);
      if (response.data.success) {
        setList(response.data.products.reverse());
      } else {
        toast.error(response.data.message);
      }
    } catch (error) {
      console.error(error);
      toast.error(error.message);
    }
  };

  const handleEditClick = (product) => {
    setEditingProduct(product);
    setUpdatedData({
      name: product.name,
      category: product.category,
      subCategory: product.subCategory,
      new_price: product.new_price,
      old_price: product.old_price || '',
      bestseller: product.bestseller,
      images: product.image || [],
      description: product.description || '',
      ageGroup: product.ageGroup || [],
    });
  };

  const removeProduct = async (id) => {
    try {
      const response = await axios.delete(
        `${backendUrl}/api/product/remove/${id}`, // Send the product ID in the URL
        {
          headers: { 
            Authorization: `Bearer ${token}` // Authorization Bearer token
          }
        }
      );
  
      if (response.data.success) {
        toast.success(response.data.message);
        await fetchList(); // Refresh the product list after successful removal
      } else {
        toast.error(response.data.message);
      }
    } catch (error) {
      console.error('Error removing product:', error);
      toast.error(error.message);
    }
  };
  

  
  const handleUpdateProduct = async () => {
    try {
      const formData = new FormData();
      formData.append('id', editingProduct._id);
      formData.append('name', updatedData.name);
      formData.append('description', updatedData.description);
      formData.append('new_price', updatedData.new_price);
      formData.append('old_price', updatedData.old_price || '');
      formData.append('category', updatedData.category);
      formData.append('subCategory', updatedData.subCategory);
      formData.append('ageGroup', JSON.stringify(updatedData.ageGroup)); // Send ageGroup as JSON string
      formData.append('bestseller', updatedData.bestseller ? 'true' : 'false'); // Convert to string
  
      // Add images if uploaded
      updatedData.images.forEach((image, index) => {
        if (typeof image !== 'string') {
          formData.append(`image${index + 1}`, image);
        }
      });
  
      const response = await axios.put(
        `${backendUrl}/api/product/update`,
        formData,
        { headers: { Authorization: `Bearer ${token}` } }
      );
  
      if (response.data.success) {
        toast.success('Product updated successfully');
        setList((prevList) =>
          prevList.map((product) =>
            product._id === editingProduct._id ? { ...product, ...updatedData } : product
          )
        );
        setEditingProduct(null); // Close the edit form
      } else {
        toast.error(response.data.message);
      }
    } catch (error) {
      console.error('Error updating product:', error);
      toast.error('Failed to update product');
    }
  };
  

  useEffect(() => {
    fetchList();
  }, []);

  return (
    <>
      <p className="mb-2">All Products List</p>
      <div className='flex flex-col gap-2'>
        {/* ------- List Table Title ---------- */}
        <div className='hidden md:grid grid-cols-[1fr_3fr_1fr_1fr_1fr] items-center py-1 px-2 border bg-gray-100 text-sm'>
          <b>Image</b>
          <b>Name</b>
          <b>Category</b>
          <b>New Price</b>
          <b className='text-center'>Action</b>
        </div>
        {list.map((item, index) => (
          <div
            key={index}
            className="grid grid-cols-[1fr_3fr_1fr_1fr_1fr] items-center gap-2 py-1 px-2 border text-sm"
          >
            <img className="w-12" src={item.image[0]} alt="" />
            <p>{item.name}</p>
            <p>{item.category}</p>
            <p>
              <span className="text-red-500 font-bold">
                {currency}
                {item.new_price}
              </span>{' '}
              </p>
            <div className="flex justify-end md:justify-center">
              <p onClick={() => handleEditClick(item)} className="cursor-pointer text-lg mr-4">
                ✎
              </p>
              <p
                onClick={() => removeProduct(item._id)}
                className="cursor-pointer text-lg text-red-600 hover:text-red-800"
              >
                X
              </p>
            </div>
          </div>
        ))}

    
{/* ------ Enhanced Edit Product Modal ------ */}
{editingProduct && (
  <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
    <div
      className="bg-white rounded-lg shadow-lg w-full max-w-lg p-6 overflow-y-auto transition-transform transform scale-100"
      style={{ maxHeight: '90vh' }}
    >
      <h3 className="text-2xl font-semibold mb-6 text-center text-gray-800">Edit Product</h3>

      <div className="space-y-4">
        {/* Product Name Input */}
        <div>
          <label className="block text-sm font-medium text-gray-700">Name</label>
          <input
            type="text"
            value={updatedData.name}
            onChange={(e) => setUpdatedData({ ...updatedData, name: e.target.value })}
            placeholder="Enter product name"
            className="border border-gray-300 rounded-md w-full p-2 mt-1 focus:ring-2 focus:ring-blue-400"
          />
        </div>

        {/* Category Dropdown */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Category</label>
            <select
              value={updatedData.category}
              onChange={(e) => setUpdatedData({ ...updatedData, category: e.target.value })}
              className="border border-gray-300 rounded-md w-full p-2 mt-1 focus:ring-2 focus:ring-blue-400"
            >
              <option value="">Select Category</option>
              <option value="Boys">Boys</option>
              <option value="Girls">Girls</option>
              <option value="Unisex">Unisex</option>
            </select>
          </div>

          {/* Sub-Category Dropdown */}
          <div>
            <label className="block text-sm font-medium text-gray-700">Sub-Category</label>
            <select
              value={updatedData.subCategory}
              onChange={(e) => setUpdatedData({ ...updatedData, subCategory: e.target.value })}
              className="border border-gray-300 rounded-md w-full p-2 mt-1 focus:ring-2 focus:ring-blue-400"
            >
              <option value="">Select Sub-Category</option>
              <option value="Topwear">Topwear</option>
              <option value="Bottomwear">Bottomwear</option>
              <option value="Dress and Rompers">Dress and Rompers</option>
              <option value="Set">Set</option>
              <option value="Shoes">Shoes</option>
            </select>
          </div>
        </div>

        {/* Price Inputs */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Old Price</label>
            <input
              type="number"
              value={updatedData.old_price}
              onChange={(e) => setUpdatedData({ ...updatedData, old_price: e.target.value })}
              placeholder="Enter old price"
              className="border border-gray-300 rounded-md w-full p-2 mt-1 focus:ring-2 focus:ring-blue-400"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">New Price</label>
            <input
              type="number"
              value={updatedData.new_price}
              onChange={(e) => setUpdatedData({ ...updatedData, new_price: e.target.value })}
              placeholder="Enter new price"
              className="border border-gray-300 rounded-md w-full p-2 mt-1 focus:ring-2 focus:ring-blue-400"
            />
          </div>
        </div>

        {/* Description Update Section */}
        <div>
          <label className="block text-sm font-medium text-gray-700">Description</label>
          <textarea
            value={updatedData.description}
            onChange={(e) => setUpdatedData({ ...updatedData, description: e.target.value })}
            placeholder="Update product description"
            className="border border-gray-300 rounded-md w-full p-2 mt-1 focus:ring-2 focus:ring-blue-400 h-28"
          />
        </div>

        {/* Age Group Selection */}
        <div>
          <p className="block text-sm font-medium text-gray-700">Age Groups</p>
          <div className="flex flex-wrap gap-2 mt-1">
            {[
              'Newborn (0-6 months)',
              'Infants (6-12 months)',
              'Toddlers (1-3 years)',
              'Kids (4-6 years)',
              'Older Kids (7-12 years)',
            ].map((age) => (
              <button
                key={age}
                type="button"
                onClick={() =>
                  setUpdatedData((prev) => ({
                    ...prev,
                    ageGroup: prev.ageGroup.includes(age)
                      ? prev.ageGroup.filter((item) => item !== age)
                      : [...prev.ageGroup, age],
                  }))
                }
                className={`px-3 py-1 text-sm rounded-md ${
                  updatedData.ageGroup.includes(age)
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-200 hover:bg-gray-300'
                }`}
              >
                {age}
              </button>
            ))}
          </div>
        </div>

        {/* Bestseller Checkbox */}
        <div className="flex items-center mt-4">
          <input
            type="checkbox"
            checked={updatedData.bestseller}
            onChange={() =>
              setUpdatedData({ ...updatedData, bestseller: !updatedData.bestseller })
            }
            className="w-5 h-5 text-blue-500 border-gray-300 rounded focus:ring-2 focus:ring-blue-400"
          />
          <label className="ml-2 text-sm font-medium text-gray-700">Bestseller</label>
        </div>

        {/* Image Upload */}
        <div className="mt-4">
          <label className="block text-sm font-medium text-gray-700">Upload Images</label>
          <input
            type="file"
            multiple
            onChange={(e) =>
              setUpdatedData({ ...updatedData, images: Array.from(e.target.files) })
            }
            className="border border-gray-300 rounded-md w-full p-2 mt-1 focus:ring-2 focus:ring-blue-400"
          />
        </div>

        {/* Action Buttons */}
        <div className="flex justify-between mt-6">
          <button
            onClick={() => setEditingProduct(null)}
            className="bg-gray-400 hover:bg-gray-500 text-white px-6 py-2 rounded-md transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleUpdateProduct}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-md transition-colors"
          >
            Update
          </button>
        </div>
      </div>
    </div>
  </div>
)}



      </div>
    </>
  );
};


export default List;

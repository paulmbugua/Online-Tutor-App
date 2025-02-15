import React, { useState } from 'react';
import { assets } from '../assets/assets';
import axios from 'axios';
import { backendUrl } from '../App';
import { toast } from 'react-toastify';

const Add = ({ token }) => {
  const [image1, setImage1] = useState(false);
  const [image2, setImage2] = useState(false);
  const [image3, setImage3] = useState(false);
  const [image4, setImage4] = useState(false);

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [oldPrice, setOldPrice] = useState('');
  const [newPrice, setNewPrice] = useState('');
  const [category, setCategory] = useState('Boys');
  const [subCategory, setSubCategory] = useState('Topwear');
  const [bestseller, setBestseller] = useState(false);
  const [ages, setAges] = useState([]);

  const onSubmitHandler = async (e) => {
    e.preventDefault();

    try {
      const formData = new FormData();
      formData.append('name', name);
      formData.append('description', description);
      formData.append('old_price', oldPrice);
      formData.append('new_price', newPrice);
      formData.append('category', category);
      formData.append('subCategory', subCategory);
      formData.append('bestseller', bestseller);
      formData.append('ages', JSON.stringify(ages));

      image1 && formData.append('image1', image1);
      image2 && formData.append('image2', image2);
      image3 && formData.append('image3', image3);
      image4 && formData.append('image4', image4);

      const response = await axios.post(
        `${backendUrl}/api/product/add`,
        formData,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (response.data.success) {
        toast.success(response.data.message);
        setName('');
        setDescription('');
        setOldPrice('');
        setNewPrice('');
        setImage1(false);
        setImage2(false);
        setImage3(false);
        setImage4(false);
      } else {
        toast.error(response.data.message);
      }
    } catch (error) {
      console.error('Error adding product:', error);
      toast.error(error.message);
    }
  };

  return (
    <form onSubmit={onSubmitHandler} className='flex flex-col w-full items-start gap-3'>
      {/* Image Upload Section */}
      <div>
        <p className='mb-2'>Upload Image</p>
        <div className='flex gap-2'>
          {[image1, image2, image3, image4].map((image, index) => (
            <label key={index} htmlFor={`image${index + 1}`}>
              <img
                className='w-20'
                src={!image ? assets.upload_area : URL.createObjectURL(image)}
                alt=''
              />
              <input
                onChange={(e) => {
                  const setImage = [setImage1, setImage2, setImage3, setImage4][index];
                  setImage(e.target.files[0]);
                }}
                type='file'
                id={`image${index + 1}`}
                hidden
              />
            </label>
          ))}
        </div>
      </div>

      {/* Product Name */}
      <div className='w-full'>
        <p className='mb-2'>Product Name</p>
        <input
          onChange={(e) => setName(e.target.value)}
          value={name}
          className='w-full max-w-[500px] px-3 py-2'
          type='text'
          placeholder='Type here'
          required
        />
      </div>

      {/* Product Description */}
      <div className='w-full'>
        <p className='mb-2'>Product Description</p>
        <textarea
          onChange={(e) => setDescription(e.target.value)}
          value={description}
          className='w-full max-w-[500px] px-3 py-2'
          placeholder='Write content here'
          required
        />
      </div>

      {/* Category and Price Section */}
      <div className='flex flex-col sm:flex-row gap-2 w-full sm:gap-8'>
        <div>
          <p className='mb-2'>Product Category</p>
          <select onChange={(e) => setCategory(e.target.value)} className='w-full px-3 py-2'>
            <option value='Boys'>Boys</option>
            <option value='Girls'>Girls</option>
            <option value='Unisex'>Unisex</option>
          </select>
        </div>

        <div>
          <p className='mb-2'>Sub Category</p>
          <select onChange={(e) => setSubCategory(e.target.value)} className='w-full px-3 py-2'>
            <option value='Topwear'>Topwear</option>
            <option value='Bottomwear'>Bottomwear</option>
            <option value='Dress and Rompers'>Dress and Rompers</option>
            <option value='Set'>Set</option>
            <option value='Shoes'>Shoes</option>
          </select>
        </div>

        {/* Old Price */}
        <div>
          <p className='mb-2'>Old Price</p>
          <input
            onChange={(e) => setOldPrice(e.target.value)}
            value={oldPrice}
            className='w-full px-3 py-2 sm:w-[120px]'
            type='number'
            placeholder='50'
            required
          />
        </div>

        {/* New Price */}
        <div>
          <p className='mb-2'>New Price</p>
          <input
            onChange={(e) => setNewPrice(e.target.value)}
            value={newPrice}
            className='w-full px-3 py-2 sm:w-[120px]'
            type='number'
            placeholder='40'
            required
          />
        </div>
      </div>

      {/* Age Groups */}
        <div>
          <p className='mb-2'>Product Age Groups</p>
          <div className='flex flex-wrap gap-2'>
            {['Newborn (0-6 months)', 'Infants (6-12 months)', 'Toddlers (1-3 years)', 'Kids (4-6 years)', 'Older Kids (7-12 years)'].map((age) => (
              <button
                key={age}
                type='button'
                onClick={() =>
                  setAges((prev) =>
                    prev.includes(age) ? prev.filter((item) => item !== age) : [...prev, age]
                  )
                }
                className={`px-2 py-1 text-sm rounded cursor-pointer ${
                  ages.includes(age) ? 'bg-pink-200 border border-pink-500' : 'bg-gray-200'
                }`}
              >
                {age}
              </button>
            ))}
          </div>
        </div>

      {/* Bestseller Checkbox */}
      <div className='flex gap-2 mt-2'>
        <input
          onChange={() => setBestseller((prev) => !prev)}
          checked={bestseller}
          type='checkbox'
          id='bestseller'
        />
        <label className='cursor-pointer' htmlFor='bestseller'>
          Add to bestseller
        </label>
      </div>

      {/* Submit Button */}
      <button type='submit' className='w-28 py-3 mt-4 bg-black text-white'>
        ADD
      </button>
    </form>
  );
};

export default Add;

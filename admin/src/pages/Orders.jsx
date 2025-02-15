import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { backendUrl, currency } from '../App';
import { toast } from 'react-toastify';
import { assets } from '../assets/assets';
import { AiOutlineClose } from 'react-icons/ai';

const Orders = ({ token }) => {
  const [orders, setOrders] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);
  const [confirmRemove, setConfirmRemove] = useState({ show: false, orderId: null });

  const fetchAllOrders = async () => {
    if (!token) return;
    try {
      const response = await axios.post(
        `${backendUrl}/api/order/list`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (response.data.success) {
        setOrders(response.data.orders.reverse());
      } else {
        toast.error(response.data.message);
      }
    } catch (error) {
      console.error('Error fetching orders:', error);
      toast.error('Failed to fetch orders. Please try again.');
    }
  };

  const statusHandler = async (event, orderId) => {
    const newStatus = event.target.value;
    try {
      const response = await axios.post(
        `${backendUrl}/api/order/status`,
        { orderId, status: newStatus },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (response.data.success) {
        toast.success('Order status updated successfully');
        await fetchAllOrders();
      } else {
        toast.error(response.data.message);
      }
    } catch (error) {
      console.error('Error updating status:', error);
      toast.error('Failed to update order status.');
    }
  };

  const removeOrder = async (orderId) => {
    try {
      const response = await axios.post(
        `${backendUrl}/api/order/remove`,
        { orderId },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (response.data.success) {
        toast.success('Order removed successfully');
        await fetchAllOrders();
      } else {
        toast.error(response.data.message);
      }
    } catch (error) {
      console.error('Error removing order:', error);
      toast.error('Failed to remove order.');
    }
  };

  const openModal = (image) => {
    setSelectedImage(image);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedImage(null);
  };

  const openConfirmRemove = (orderId) => {
    setConfirmRemove({ show: true, orderId });
  };

  const confirmDelete = () => {
    if (confirmRemove.orderId) {
      removeOrder(confirmRemove.orderId);
      setConfirmRemove({ show: false, orderId: null });
    }
  };

  const cancelDelete = () => {
    setConfirmRemove({ show: false, orderId: null });
  };

  useEffect(() => {
    fetchAllOrders();
  }, [token]);

  return (
    <div className="p-4 md:p-8">
      <h3 className="text-center text-2xl font-bold my-5">Order Page</h3>
      <div className="space-y-6">
        {orders.map((order, index) => (
          <div
            key={index}
            className="border rounded-md shadow-md p-4 flex flex-col sm:flex-row gap-4"
          >
            {/* Items in the Order */}
            <div className="flex flex-wrap gap-4 items-center">
              {order.items.map((item, i) => (
                <div key={i} className="flex items-center gap-3">
                  <img
                    className="w-24 h-24 object-cover rounded cursor-pointer"
                    src={item.image || assets.parcel_icon}
                    alt={item.name || 'Order Item'}
                    onClick={() => openModal(item.image)}
                  />
                  <div className="text-sm">
                    <p className="font-medium">{item.name}</p>
                    <p>
                      {currency}
                      {item.price}
                    </p>
                    {item.age && (
                      <p className="text-gray-600">Age Group: {item.age}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Delivery Address */}
            <div className="flex-1">
              <h4 className="font-semibold">Delivery Address:</h4>
              <p>
                {order.address.firstName} {order.address.lastName}
              </p>
              <p>{order.address.street}, {order.address.city}</p>
              <p>{order.address.state}, {order.address.country}, {order.address.zipcode}</p>
              <p>Phone: {order.address.phone}</p>
              <p style={{ color: 'red' }}><strong>Instructions:</strong> {order.address.orderNote}</p>

            </div>

            {/* Payment and Status */}
            <div className="flex-1 space-y-2 text-sm">
              <p>Items: {order.items.length}</p>
              <p>Method: {order.paymentMethod}</p>
              <p>Payment: {order.payment ? 'Done' : 'Pending'}</p>
              <p>Date: {new Date(order.date).toLocaleDateString()}</p>
              <p className="font-semibold">
                Total: {currency}
                {order.amount}
              </p>
              <select
                onChange={(event) => statusHandler(event, order._id)}
                value={order.status}
                className="p-2 border rounded w-full"
              >
                <option value="Order Placed">Order Placed</option>
                <option value="Packing">Packing</option>
                <option value="Shipped">Shipped</option>
                <option value="Out for delivery">Out for delivery</option>
                <option value="Delivered">Delivered</option>
              </select>
              <button
                onClick={() => openConfirmRemove(order._id)}
                className="bg-red-500 text-white px-4 py-2 rounded w-full mt-2"
              >
                Remove
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Modal for Image Expansion */}
      {isModalOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50"
          onClick={closeModal}
        >
          <div className="relative">
            <button
              className="absolute top-2 right-2 text-white text-2xl"
              onClick={closeModal}
            >
              <AiOutlineClose />
            </button>
            <img
              src={selectedImage}
              alt="Expanded view"
              className="max-w-full max-h-full object-contain"
            />
          </div>
        </div>
      )}

      {/* Confirmation Dialog */}
      {confirmRemove.show && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded shadow-lg text-center">
            <h2 className="text-lg font-semibold mb-4">Confirm Deletion</h2>
            <p className="mb-6">Are you sure you want to remove this order? This action cannot be undone.</p>
            <div className="flex justify-center gap-4">
              <button
                onClick={confirmDelete}
                className="bg-red-500 text-white px-6 py-2 rounded"
              >
                Yes, Remove
              </button>
              <button
                onClick={cancelDelete}
                className="bg-gray-300 px-6 py-2 rounded"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Orders;

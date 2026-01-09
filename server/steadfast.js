
/**
 * STEADFAST COURIER API INTEGRATION (Node.js/Express)
 * This file contains the backend logic to communicate with Steadfast.
 */
const axios = require('axios');

// Configuration - Use environment variables for security
const STEADFAST_API_KEY = process.env.STEADFAST_API_KEY;
const STEADFAST_SECRET_KEY = process.env.STEADFAST_SECRET_KEY;
const STEADFAST_BASE_URL = 'https://portal.steadfast.com.bd/api/v1';

/**
 * Creates an order in Steadfast system
 * @param {Object} order - Internal order object from SaaS
 * @returns {Promise<Object>} - Steadfast response data
 */
async function createSteadfastOrder(order) {
  try {
    const payload = {
      invoice: order.id,
      recipient_name: order.customerName,
      recipient_phone: order.customerPhone,
      recipient_address: order.customerAddress,
      cod_amount: order.totalAmount,
      note: order.notes || "Order from OrderHub SaaS",
    };

    const response = await axios.post(`${STEADFAST_BASE_URL}/create_order`, payload, {
      headers: {
        'Api-Key': STEADFAST_API_KEY,
        'Secret-Key': STEADFAST_SECRET_KEY,
        'Content-Type': 'application/json',
      },
    });

    // Check for success status in the API response
    if (response.data && response.data.status === 200) {
      console.log(`Steadfast order created successfully: ${response.data.consignment_id}`);
      return {
        success: true,
        consignment_id: response.data.consignment_id,
        courier_status: response.data.order_status,
        raw: response.data
      };
    } else {
      throw new Error(response.data.message || 'Steadfast API error');
    }
  } catch (error) {
    console.error('Steadfast Integration Error:', error.response?.data || error.message);
    return {
      success: false,
      error: error.response?.data?.message || error.message
    };
  }
}

module.exports = { createSteadfastOrder };

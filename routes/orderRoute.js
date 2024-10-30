const Order = require("../model/orderModel");
const { OrderItem } = require("../model/order-item");

const express = require("express");

const router = express.Router();

router.get(`/`, async (req, res) => {
  try {
    const orderList = await Order.find().populate("user", "name").sort({
      dateOrdered: -1,
    });

    if (!orderList || orderList.length === 0) {
      return res
        .status(404)
        .json({ success: false, message: "No orders found" });
    }

    res.status(200).json({ success: true, data: orderList });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.get(`/:id`, async (req, res) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate("user", "name")
      .populate({
        path: "orderItems",
        populate: { path: "product", populate: "category" },
      });

    if (!order) {
      return res
        .status(404)
        .json({ success: false, message: "The order was not found" });
    }

    res.status(200).json({ success: true, data: order });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.post("/", async (req, res) => {
  try {
    console.log("Order Items received:", req.body.orderItems);

    const orderItemsIds = await Promise.all(
      req.body.orderItems.map(async (orderItem) => {
        let newOrderItem = new OrderItem({
          quantity: orderItem.quantity,
          product: orderItem.product,
        });

        newOrderItem = await newOrderItem.save();
        console.log("Saving order item:", newOrderItem);

        return newOrderItem._id;
      })
    );

    console.log("Order Items saved:", orderItemsIds);

    const totalPrices = await Promise.all(
      orderItemsIds.map(async (orderItemId) => {
        const orderItem = await OrderItem.findById(orderItemId).populate(
          "product",
          "price"
        );
        if (!orderItem || !orderItem.product) {
          throw new Error(
            `Product not found for order item with ID ${orderItemId}`
          );
        }
        const totalPrice = orderItem.product.price * orderItem.quantity;
        return totalPrice;
      })
    );

    // Calculate total price
    const totalPrice = totalPrices.reduce((a, b) => a + b, 0);

    // Create new order
    let order = new Order({
      orderItems: orderItemsIds,
      shippingAddress1: req.body.shippingAddress1,
      shippingAddress2: req.body.shippingAddress2,
      city: req.body.city,
      zip: req.body.zip,
      country: req.body.country,
      phone: req.body.phone,
      status: req.body.status,
      totalPrice: totalPrice,
      user: req.body.user,
    });

    order = await order.save();

    if (!order) {
      return res.status(400).send("The order cannot be created!");
    }

    res.status(201).send(order);
  } catch (err) {
    console.error("Error in order creation:", err);
    res.status(500).json({ success: false, error: err.message });
  }
});

router.put("/:id", async (req, res) => {
  try {
    const order = await Order.findByIdAndUpdate(
      req.params.id,
      {
        status: req.body.status,
      },
      { new: true }
    );

    if (!order) {
      return res
        .status(404)
        .json({ success: false, message: "Order not found" });
    }

    res.status(200).json({ success: true, data: order });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.delete("/:id", async (req, res) => {
  try {
    const order = await Order.findByIdAndRemove(req.params.id);

    if (!order) {
      return res
        .status(404)
        .json({ success: false, message: "Order not found" });
    }

    await order.orderItems.map(async (orderItem) => {
      await OrderItem.findByIdAndRemove(orderItem);
    });

    res.status(200).json({ success: true, message: "Order is deleted" });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.get("/get/totalsales", async (req, res) => {
  try {
    const totalSales = await Order.aggregate([
      { $group: { _id: null, totalsales: { $sum: "$totalPrice" } } },
    ]);

    if (!totalSales) {
      return res.status(400).json({
        success: false,
        message: "The order sales cannot be generated",
      });
    }

    res.status(200).json({ success: true, data: totalSales.pop().totalsales });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.get("/get/count", async (req, res) => {
  try {
    const orderCount = await Order.countDocuments();

    if (!orderCount) {
      return res.status(400).json({
        success: false,
        message: "The order count cannot be generated",
      });
    }

    res.status(200).json({ success: true, data: orderCount });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.get("/get/userorders/:userid", async (req, res) => {
  try {
    const userOrderList = await Order.find({ user: req.params.userid })
      .populate({
        path: "orderItems",
        populate: { path: "product", populate: "category" },
      })
      .sort({ dateOrdered: -1 });

    if (!userOrderList) {
      return res
        .status(404)
        .json({ success: false, message: "No orders found for this user" });
    }

    res.status(200).json({ success: true, data: userOrderList });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;

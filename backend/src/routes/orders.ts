import express from 'express';
import { AuthRequest } from '../middleware/auth.js';
import { dbGet, dbAll, dbRun } from '../database.js';

const router = express.Router();

// Get all orders
router.get('/', async (req: AuthRequest, res) => {
  try {
    const orders = await dbAll(`
      SELECT 
        o.*,
        u.name as created_by_name
      FROM orders o
      LEFT JOIN users u ON o.created_by = u.id
      ORDER BY o.date_created DESC
    `);

    // Get comments for each order
    for (const order of orders) {
      const comments = await dbAll(`
        SELECT 
          c.*,
          u.name as user_name
        FROM comments c
        JOIN users u ON c.user_id = u.id
        WHERE c.order_id = $1
        ORDER BY c.created_at DESC
      `, [order.id]);

      order.comments = comments;
    }

    res.json(orders);
  } catch (error: any) {
    console.error('Get orders error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get single order
router.get('/:id', async (req: AuthRequest, res) => {
  try {
    const order = await dbGet(`
      SELECT 
        o.*,
        u.name as created_by_name
      FROM orders o
      LEFT JOIN users u ON o.created_by = u.id
      WHERE o.id = $1
    `, [req.params.id]);

    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    // Get comments
    const comments = await dbAll(`
      SELECT 
        c.*,
        u.name as user_name
      FROM comments c
      JOIN users u ON c.user_id = u.id
      WHERE c.order_id = $1
      ORDER BY c.created_at DESC
    `, [order.id]);

    // Get history
    const history = await dbAll(`
      SELECT 
        h.*,
        u.name as user_name
      FROM order_history h
      JOIN users u ON h.user_id = u.id
      WHERE h.order_id = $1
      ORDER BY h.created_at DESC
    `, [order.id]);

    order.comments = comments;
    order.history = history;

    res.json(order);
  } catch (error: any) {
    console.error('Get order error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

const ORDER_TYPES = ['Stock', 'Purchase', 'Special'];

// Create order
router.post('/', async (req: AuthRequest, res) => {
  try {
    const { 
      patient_name, 
      due_date, 
      status, 
      order_type,
      sph_od,
      cyl_od,
      axis_od,
      add_od,
      va_od,
      prism_bases_od,
      sph_os,
      cyl_os,
      axis_os,
      add_os,
      va_os,
      prism_bases_os
    } = req.body;
    
    const type = order_type && ORDER_TYPES.includes(order_type) ? order_type : 'Stock';

    if (!patient_name || !due_date) {
      return res.status(400).json({ error: 'Patient name and due date are required' });
    }

    const result = await dbRun(
      `INSERT INTO orders (
        patient_name, due_date, status, order_type, created_by,
        sph_od, cyl_od, axis_od, add_od, va_od, prism_bases_od,
        sph_os, cyl_os, axis_os, add_os, va_os, prism_bases_os
       )
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17)
       RETURNING id`,
      [
        patient_name, 
        due_date, 
        status || 'Open', 
        type, 
        req.userId,
        sph_od || null,
        cyl_od || null,
        axis_od || null,
        add_od || null,
        va_od || null,
        prism_bases_od || null,
        sph_os || null,
        cyl_os || null,
        axis_os || null,
        add_os || null,
        va_os || null,
        prism_bases_os || null
      ]
    );

    // Log creation in history
    await dbRun(
      `INSERT INTO order_history (order_id, user_id, field_name, old_value, new_value)
       VALUES ($1, $2, $3, $4, $5)`,
      [result.lastID, req.userId, 'status', null, status || 'Open']
    );

    const order = await dbGet('SELECT * FROM orders WHERE id = $1', [result.lastID]);
    res.status(201).json(order);
  } catch (error: any) {
    console.error('Create order error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update order
router.put('/:id', async (req: AuthRequest, res) => {
  try {
    const { 
      patient_name, 
      due_date, 
      status, 
      order_type,
      sph_od,
      cyl_od,
      axis_od,
      add_od,
      va_od,
      prism_bases_od,
      sph_os,
      cyl_os,
      axis_os,
      add_os,
      va_os,
      prism_bases_os
    } = req.body;
    const orderId = req.params.id;

    // Get current order
    const currentOrder = await dbGet('SELECT * FROM orders WHERE id = $1', [orderId]);
    if (!currentOrder) {
      return res.status(404).json({ error: 'Order not found' });
    }

    const newOrderType =
      order_type !== undefined && ORDER_TYPES.includes(order_type)
        ? order_type
        : (currentOrder.order_type ?? 'Stock');

    // Update order
    await dbRun(
      `UPDATE orders 
       SET patient_name = $1, due_date = $2, status = $3, order_type = $4,
           sph_od = $6, cyl_od = $7, axis_od = $8, add_od = $9, va_od = $10, prism_bases_od = $11,
           sph_os = $12, cyl_os = $13, axis_os = $14, add_os = $15, va_os = $16, prism_bases_os = $17
       WHERE id = $5`,
      [
        patient_name || currentOrder.patient_name,
        due_date || currentOrder.due_date,
        status !== undefined ? status : currentOrder.status,
        newOrderType,
        orderId,
        sph_od !== undefined ? sph_od : currentOrder.sph_od,
        cyl_od !== undefined ? cyl_od : currentOrder.cyl_od,
        axis_od !== undefined ? axis_od : currentOrder.axis_od,
        add_od !== undefined ? add_od : currentOrder.add_od,
        va_od !== undefined ? va_od : currentOrder.va_od,
        prism_bases_od !== undefined ? prism_bases_od : currentOrder.prism_bases_od,
        sph_os !== undefined ? sph_os : currentOrder.sph_os,
        cyl_os !== undefined ? cyl_os : currentOrder.cyl_os,
        axis_os !== undefined ? axis_os : currentOrder.axis_os,
        add_os !== undefined ? add_os : currentOrder.add_os,
        va_os !== undefined ? va_os : currentOrder.va_os,
        prism_bases_os !== undefined ? prism_bases_os : currentOrder.prism_bases_os
      ]
    );

    // Log changes in history
    if (status !== undefined && status !== currentOrder.status) {
      await dbRun(
        `INSERT INTO order_history (order_id, user_id, field_name, old_value, new_value)
         VALUES ($1, $2, $3, $4, $5)`,
        [orderId, req.userId, 'status', currentOrder.status, status]
      );
    }

    if (patient_name !== undefined && patient_name !== currentOrder.patient_name) {
      await dbRun(
        `INSERT INTO order_history (order_id, user_id, field_name, old_value, new_value)
         VALUES ($1, $2, $3, $4, $5)`,
        [orderId, req.userId, 'patient_name', currentOrder.patient_name, patient_name]
      );
    }

    if (due_date !== undefined && due_date !== currentOrder.due_date) {
      await dbRun(
        `INSERT INTO order_history (order_id, user_id, field_name, old_value, new_value)
         VALUES ($1, $2, $3, $4, $5)`,
        [orderId, req.userId, 'due_date', currentOrder.due_date, due_date]
      );
    }

    if (newOrderType !== (currentOrder.order_type ?? 'Stock')) {
      await dbRun(
        `INSERT INTO order_history (order_id, user_id, field_name, old_value, new_value)
         VALUES ($1, $2, $3, $4, $5)`,
        [orderId, req.userId, 'order_type', currentOrder.order_type ?? 'Stock', newOrderType]
      );
    }

    // Log prescription field changes
    const prescriptionFields = [
      { dbCol: 'sph_od', displayName: 'Sph (OD)' },
      { dbCol: 'cyl_od', displayName: 'Cyl (OD)' },
      { dbCol: 'axis_od', displayName: 'Axis (OD)' },
      { dbCol: 'add_od', displayName: 'Add (OD)' },
      { dbCol: 'va_od', displayName: 'VA (OD)' },
      { dbCol: 'prism_bases_od', displayName: 'Prism Bases (OD)' },
      { dbCol: 'sph_os', displayName: 'Sph (OS)' },
      { dbCol: 'cyl_os', displayName: 'Cyl (OS)' },
      { dbCol: 'axis_os', displayName: 'Axis (OS)' },
      { dbCol: 'add_os', displayName: 'Add (OS)' },
      { dbCol: 'va_os', displayName: 'VA (OS)' },
      { dbCol: 'prism_bases_os', displayName: 'Prism Bases (OS)' }
    ];

    const valueMap = { sph_od, cyl_od, axis_od, add_od, va_od, prism_bases_od, sph_os, cyl_os, axis_os, add_os, va_os, prism_bases_os };
    
    for (const field of prescriptionFields) {
      const newVal = valueMap[field.dbCol as keyof typeof valueMap];
      if (newVal !== undefined && newVal !== currentOrder[field.dbCol as keyof typeof currentOrder]) {
        await dbRun(
          `INSERT INTO order_history (order_id, user_id, field_name, old_value, new_value)
           VALUES ($1, $2, $3, $4, $5)`,
          [orderId, req.userId, field.displayName, currentOrder[field.dbCol as keyof typeof currentOrder]?.toString() || null, newVal?.toString() || null]
        );
      }
    }

    const updatedOrder = await dbGet('SELECT * FROM orders WHERE id = $1', [orderId]);
    res.json(updatedOrder);
  } catch (error: any) {
    console.error('Update order error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Delete order
router.delete('/:id', async (req: AuthRequest, res) => {
  try {
    const orderId = req.params.id;
    const order = await dbGet('SELECT * FROM orders WHERE id = $1', [orderId]);

    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    await dbRun('DELETE FROM orders WHERE id = $1', [orderId]);
    res.json({ message: 'Order deleted successfully' });
  } catch (error: any) {
    console.error('Delete order error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Add comment
router.post('/:id/comments', async (req: AuthRequest, res) => {
  try {
    const { comment } = req.body;
    const orderId = req.params.id;

    if (!comment) {
      return res.status(400).json({ error: 'Comment is required' });
    }

    const order = await dbGet('SELECT * FROM orders WHERE id = $1', [orderId]);
    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    const result = await dbRun(
      'INSERT INTO comments (order_id, user_id, comment) VALUES ($1, $2, $3) RETURNING id',
      [orderId, req.userId, comment]
    );

    const newComment = await dbGet(`
      SELECT 
        c.*,
        u.name as user_name
      FROM comments c
      JOIN users u ON c.user_id = u.id
      WHERE c.id = $1
    `, [result.lastID]);

    res.status(201).json(newComment);
  } catch (error: any) {
    console.error('Add comment error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;


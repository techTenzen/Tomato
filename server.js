const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

mongoose.connect('mongodb://localhost:27017/shopDatabase', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => console.log('Connected to MongoDB'))
.catch(err => console.error('Could not connect to MongoDB', err));

const shopSchema = new mongoose.Schema({
  name: String,
  imageUrl: String,
});
const Shop = mongoose.model('Shop', shopSchema);

const itemSchema = new mongoose.Schema({
  shopId: { type: mongoose.Schema.Types.ObjectId, ref: 'Shop' },
  name: String,
  price: Number,
  quantity: Number,
  imageUrl: String,
});
const Item = mongoose.model('Item', itemSchema);

app.get('/api/shops', async (req, res) => {
  try {
    const shops = await Shop.find();
    res.json(shops);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

app.get('/api/shops/:shopId/items', async (req, res) => {
  try {
    const { shopId } = req.params;
    const items = await Item.find({ shopId: mongoose.Types.ObjectId(shopId) });
    res.json(items);
  } catch (error) {
    console.error('Error fetching items:', error);
    res.status(500).json({ message: 'Error fetching items. Please try again later.' });
  }
});

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
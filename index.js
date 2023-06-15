const express = require('express')
const cors = require('cors');
const jwt = require('jsonwebtoken');

const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
require('dotenv').config();
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);





const app = express()
const port = process.env.PORT || 5000


app.use(cors());
app.use(express.json())

// run().catch(console.dir)




const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.hc9vrhc.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });
console.log(uri)

async function run() {
  try {
    await client.connect();
    console.log('donedf')


  }
  catch (err) {
    run()
  }
}

run()

const toolCollection = client.db('ManuFacture').collection('tools')
const orderCollection = client.db('ManuFacture').collection('order')
const paymentCollection = client.db('ManuFacture').collection('payment')
const profileCollection = client.db('ManuFacture').collection('profile')
const userCollection = client.db('ManuFacture').collection('user')
const reviewCollection = client.db('ManuFacture').collection('reviews')



app.get('/service', async (req, res) => {
  const query = {};
  const services = await toolCollection.find(query).toArray();
  res.send(services)
})
app.get('/service/:id', async (req, res) => {
  const id = req.params.id;
  const query = { _id: new ObjectId(id) }
  const service = await toolCollection.findOne(query);
  res.send(service)
})
app.delete('/service/:id', async (req, res) => {
  const id = req.params.id;
  const query = { _id: new ObjectId(id) };
  const result = await toolCollection.deleteOne(query)
  res.send(result)

})

app.put('/service/:id', async (req, res) => {
  const { OrderQuantity } = req.body;
  const id = req.params.id;
  const query = { _id: new ObjectId(id) }
  const result = await toolCollection.updateOne(query, { $set: { OrderQuantity } }, { upsert: false })
  res.send(result)
})

app.post('/order', async (req, res) => {
  const order = req.body;
  const query = { email: order.email }
  const purchase = await orderCollection.insertOne(order, query);
  res.send(purchase)
})

app.get('/order', async (req, res) => {
  const queryEmail = req.query.email;
  const authorization = req.headers.authorization; 
  console.log('auth',authorization)
  console.log(queryEmail)
  if (queryEmail) {
    const query = { email: queryEmail };
    const order = await orderCollection.find(query).toArray();
    res.send(order)
  }

})


app.get('/order/:id', async (req, res) => {
  const id = req.params.id;
  const query = { _id: new ObjectId(id) };
  const order = await orderCollection.findOne(query);
  res.send(order)
})

// app.get('/order', async (req, res) => {
//   const queryEmail = req.query.email;
//   const query = { email: queryEmail };
//   const orders = await orderCollection.find(query).toArray();
//   res.send(orders)
// })

app.patch('/order/:id', async (req, res) => {
  const id = req.params.id;
  const payment = req.body;
  const filter = { _id: new ObjectId(id) };
  const updatedDoc = {
    $set: {
      paid: true,
      transactionId: payment.transactionId
    }
  }
  const updatedOrder = await orderCollection.updateOne(filter, updatedDoc);
  const result = await paymentCollection.insertOne(payment);
  res.send(updatedOrder)
})

app.post('/create-payment-intent', async (req, res) => {
  const tool = req.body;
  const price = tool.price;
  const amount = price * 100;
  const paymentIntent = await stripe.paymentIntents.create({
    amount: amount,
    currency: "usd",
    payment_method_types: ['card']
  });
  res.send({ clientSecret: paymentIntent.client_secret })

});

app.get('/profile/:email', async (req, res) => {
  const email = req.params.email;
  const user = await profileCollection.findOne({ email: email })

  res.send(user)
})

app.put('/profile/:email', async (req, res) => {
  const email = req.params.email;
  const update = req.body;
  const query = { email: email }
  const result = await profileCollection.updateOne(query, { $set: update }, { upsert: false })
  res.send(result)
})


app.post('/profile', async (req, res) => {
  const profile = req.body;
  const result = await profileCollection.insertOne(profile)
  res.send(result)
})

app.put('/user/:email', async (req, res) => {
  const email = req.params.email;
  const user = req.body
  const filter = { email: email }
  const options = { upsert: true }
  const updateDoc = {
    $set: user
  };
  const result = await userCollection.updateOne(filter, updateDoc, options);
  
  const token = jwt.sign({ email: email }, process.env.ACCESS_TOKEN_SECRET)

  res.send({ result, token })
})

app.put('/user/admin/:email', async (req, res) => {
  const email = req.params.email;

  const filter = { email: email }

  const updateDoc = {
    $set: { role: 'admin' }
  };
  const result = await userCollection.updateOne(filter, updateDoc);

  res.send(result)


})

app.get('/admin/:email', async (req, res) => {
  const email = req.params.email;
  const user = await userCollection.findOne({ email: email })
  const isAdmin = user.role === 'admin';
  res.send({ admin: isAdmin })
})

app.get('/user', async (req, res) => {
  const users = await userCollection.find().toArray();
  res.send(users)
})

app.get('/review', async (req, res) => {
  const query = {};
  const reviews = await reviewCollection.find(query).toArray();
  res.send(reviews)
})

app.post('/review', async (req, res) => {
  const review = req.body;
  const result = await reviewCollection.insertOne(review)
  res.send(result)
})

app.get('/manageOrder', async (req, res) => {
  const query = {}
  const result = await orderCollection.find(query).toArray()
  res.send(result)
})
app.delete('/manageOrder/:id', async (req, res) => {
  const id = req.params.id;
  const query = { _id: new ObjectId(id) };
  const result = await orderCollection.deleteOne(query);
  res.send(result)
})
app.post('/addProduct', async (req, res) => {
  const body = req.body;
  const result = await toolCollection.insertOne(body);
  res.send(result)
})

app.get('/', (req, res) => {
  res.send('hello world')
})

app.listen(port, () => {
  console.log('listening', port)
})

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const app = express();
const port = process.env.PORT || 8000;
const { MongoClient, ServerApiVersion } = require('mongodb');

app.use(cors());
app.use(express.json());

const uri = `mongodb+srv://${process.env.DB_user}:${process.env.DB_password}@cluster0.utrln.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;


// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

async function run() {
  try {


    const dataBase = client.db('PH_11_AS_server').collection('tutorials');

    //!get (all/ full/ bulk) data from surver [Demo or test purpose]
    app.get('/cards', async(req, res)=>{
      try{
        const cursor = dataBase.find();
        const result = await cursor.toArray();
        res.send(result);
        console.log(result);
      }
      catch (error) {
        console.error('Error fetching language data:', error);
        res.status(500).send({ error: 'Failed to fetch products' });
      }
    })

    //* get data/find-tutors based on language
    app.get('/find-tutors/:language?', async(req, res)=>{
      try{
        const language = req.params.language;
        const query = language ? { language: language } : {};
        const result = await dataBase.find(query).toArray();
        res.send(result);
        console.log(result);
      } 
      catch (err){
        console.error('Error from find-tutors route:', err);
      }
    })


    // Connect the client to the server	(optional starting in v4.7)
    await client.connect();
    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);


app.get('/', (req, res)=>{
    res.send('surver is running')
})

app.listen(port, ()=>{
    console.log(`surver is running on ${port}`)
})
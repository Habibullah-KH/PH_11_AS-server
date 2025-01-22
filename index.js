require('dotenv').config();
const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const cookieParser = require('cookie-parser');
const app = express();
const port = process.env.PORT || 9220;
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');

app.use(cors({
  origin: ['http://localhost:5173', 'https://ph-11-as-cef28.web.app', 'ph-11-as-cef28.firebaseapp.com'],
  credentials: true

}));
app.use(express.json());
app.use(cookieParser());

const verifyToken = (req, res, next) =>{
  const token = req.cookies?.token ;
  if(!token){
    return res.status(410).send({message: 'unauthorize access'});
  }

  //verify
  jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, decoded) =>{
    if(err){
      return res.status(401).send({message: 'unauthorized access'});
    }
    req.user = decoded;
    next();
  })
}

const uri = `mongodb+srv://${process.env.DB_user}:${process.env.DB_password}@cluster0.utrln.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;


// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});
// const client = new MongoClient(uri, {
//   useNewUrlParser: true,
//   useUnifiedTopology: true,
//   serverApi: { version: '1', strict: false }
// });

async function run() {
  try {

//? tutorial server
    const dataBase = client.db('PH_11_AS_server').collection('tutorials');

//? user data server
    const userDB = client.db('PH_11_AS_server').collection('userBookedData');

    //?jwt token
app.post('/jwt', (req, res)=>{
  const user = req.body;
  const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, {
    expiresIn: '30d'
  });
  res.cookie('token', token, {
    httpOnly: true,
    secure: false,
    
  })
  .send({success: true})
})

//?logout clear cookie
app.post('/logout', (req, res)=>{
  res.clearCookie('token', {
    httpOnly: true,
    secure: false
  })
  .send({success:  true})
})

    //!get (all/ full/ bulk) data from surver [Demo or test purpose]
    app.get('/cards', async (req, res) => {
      try {
        const search = req.query.search

          let query = {
            language: {
              $regex: search,
              $options: 'i'
            },
          }
          const result = await dataBase.find(query).toArray();
          res.send(result);
        }
         catch (error) {
        console.error('Error fetching language data:', error);
        res.status(500).send({ error: 'Failed to fetch products' });
      }
    });
    
    

    //* get data/find-tutors based on language
    app.get('/find-tutors/:language', async(req, res)=>{
      try{
        const language = req.params.language;
        const query = language ? { language: language } : {};
        const result = await dataBase.find(query).toArray();
        res.send(result);
        // console.log(result);
      } 
      catch (err){
        console.error('Error from find-tutors route:', err);
      }
    })
    //***Add my tutorial on server
    app.post('/addTutorial', async(req, res)=>{
      try{
        const data = req.body;
        const result = await dataBase.insertOne(data);
        res.send(result)
      }
      catch (error) {
        console.error('Error from addTutorial route:', error);
      }
    })
    //***get my tutorial on server
    app.get('/mytutorial/:email', verifyToken, async(req, res)=>{
      try{
        const email = req.params.email;
        const query = {email: email};

        // console.log(req.cookies?.token);
        if(req.user.email !== req.params.email){
          return res.status(403).send({message: 'forbidden'})
        }
        // console.log('user email:',req.user.email);
        // console.log('params emeail:',req.params.email);
        // console.log(req.user.email === req.params.email);
        

        const result = await dataBase.find(query).toArray();
        res.send(result)
      }
      catch (err){
        console.error('Error fetching from userDB mytutorial route:', err)
      }
    })
    //***Update my tutorial
    app.put('/UpdateMyTutorial/:id', async(req, res)=>{
      try{
        const id = req.params.id;
        const filter = {_id: new ObjectId(id)}
        const options = { upsert: true};
        const updatedTutorial = req.body;
        const updatedTutorials = {
          $set: {
            email: updatedTutorial.email,
             name: updatedTutorial.name,
             image: updatedTutorial.image,
             description: updatedTutorial.description,
             price: updatedTutorial.price,
             language: updatedTutorial.language,
             rating: updatedTutorial.rating

          }
        }
        const result = await dataBase.updateOne(filter, updatedTutorials, options)
        res.send(result);
      }
      catch (err){
        console.error('Error fetching from dataBase UpdateMyTutorial route:', err)
      }
    })
    //*** delete my tutorial
    app.delete('/delete/:id', async(req, res)=>{
      try{
        const id = req.params.id;
        const query = {_id: new ObjectId(id)};
        const result = await dataBase.deleteOne(query);
        if (!query) {
          return res.status(400).send({ message: 'property missing' });
        }
        res.send(result);
      }
      catch (err) {
        console.error('Error fetching products:', err);
      }
    })

    //*get tutors data
    app.get('/tutor/:details', async(req, res)=>{
      try{
        const details = req.params.details;
        const query = {_id: new ObjectId(details)}
        const result = await dataBase.find(query).toArray();
        res.send(result);
      }
      catch (error) {
        console.error('Error fetching products:', error);
      }
    })
    //*create (user data)/(user book data)
    app.post('/bookData', async(req, res)=>{
      try{
        const userData = req.body;
        const {tutorId} = userData;
        const query = {tutorId};  

        const dataValided = await userDB.findOne(query);
        if (dataValided) {
          return res.status(400).send({ message: 'You already booked this tutor.' });
        }
        const result = await userDB.insertOne(userData);
        res.status(201).send({ message: 'Tutor booked successfully!', result });
      }
      catch (err) {
        console.error('Error fetchig from userDB:', err)
      }
    })
    //* get data for My Booked Tutor route
    app.get('/myBookedData/:email', async(req, res)=>{
      try{
        const email = req.params.email;
        const query = {email: email};
        const result = await userDB.find(query).toArray();
        res.send(result)
      }
      catch (err){
        console.error('Error fetching from userDB myyBookedData route:', err)
      }
    })
      //!get all booked data
      app.get('/allMyBookedData', async(req, res)=>{
        try{
          const data = userDB.find();
          const result = await data.toArray() ;
          res.send(result)
        }
        catch (error) {
          console.error('Error fetching products:', error);
          res.status(500).send({ error: 'Failed to fetch allMyBookedData' });
        }
      })
    //* user review count
    const { ObjectId } = require('mongodb');

    app.post('/review', async (req, res) => {
      try {
        const { tutorId } = req.body;
    
        if (!tutorId) {
          return res.status(400).send({ error: 'Tutor ID is required' });
        }
    
        const filter = { _id: new ObjectId(tutorId) }; // Ensure valid ObjectId
        const update = { $inc: { review: 1 } };
    
        const updateReviewCount = await dataBase.updateOne(filter, update);
    
        if (updateReviewCount.modifiedCount === 0) {
          return res.status(404).send({ error: 'Tutor not found' });
        }
    
        res.send({ success: true, message: 'Review count updated' });
      } catch (err) {
        console.error('Error updating review:', err);
        res.status(500).send({ error: 'Internal Server Error' });
      }
    });

    //!! count users

    app.get('/countUsers', async (req, res) => {
      try {
        const cursor =  dataBase.find();
        const result = await cursor.toArray();
        res.send(result);

      } catch (error) {
        console.error('Error fetching products:', error);
        res.status(500).send({ error: 'Failed to fetch products' });
      }
    });
        
    

    // Connect the client to the server	(optional starting in v4.7)
    await client.connect();
    // Send a ping to confirm a successful connection
    // await client.db("admin").command({ ping: 1 });
    // console.log("Pinged your deployment. You successfully connected to MongoDB!");
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
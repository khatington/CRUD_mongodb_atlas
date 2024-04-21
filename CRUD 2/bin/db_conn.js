// REFERENCED: the connection code came directly from mongoDB Atlas
const { MongoClient, ServerApiVersion } = require('mongodb');
const uri = "mongodb+srv://u230544:keejei2Kou4ue6He@cs230-u230544.hiuzfq0.mongodb.net/?retryWrites=true&w=majority&appName=cs230-u230544";
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
    // Connect the client to the server	(optional starting in v4.7)
    await client.connect();
    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
    // Ensures that the client will close when you finish/error
    await client.close();
  }
}
run().catch(console.dir);

//function to create new customer
async function insertCustomer(details)
{
  //ensures that this function will wait until connectToDatabase works
  const client = await connectToDatabase();


  try
  {
    //validate required fields using an if statement
    if(!details.firstname || !details.surname || !details.mobile || !details.email || !details.address_line1 || !town || !county_city)
    {
      throw new Error('Please fill out all required fields');
    }
    //creating a customer collection here
    const db = client.db("cs230-u230544");
    const customers = db.collection("customers");

    //inserting customers, await until the insertCustomer function works
    const result = await customers.insertOne(details);
    console.log('Customer inserted: ', result.ops[0]);
  } 
  catch (err)
  {
    console.error('Error inserting customer: ', err);
    throw err;
  } 
  finally
  {
    await client.close(); 
  }
}

// insertCustomer(
//   {
//     title: 'Mr.',
//     firstname: 'John',
//     lastname: 'Doe',
//     email: 'Doe@example.com',
//     phone: '1234567800',
//     address:
//   }
// )

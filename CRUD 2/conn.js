const { MongoClient } = require('mongodb');
const { v4: uuidv4 } = require('uuid'); //Due to error, using this alternative instead of ObjectId

//establishing mongoDB Atlas connection 
const uri = "mongodb+srv://u230544:keejei2Kou4ue6He@cs230-u230544.hiuzfq0.mongodb.net/?retryWrites=true&w=majority&appName=cs230-u230544";

class Database {
    constructor() {
        this.client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });
    }

    async connect() {
        try {
            // Connect to the MongoDB Atlas cluster
            await this.client.connect();
            console.log('Connected to MongoDB Atlas');
        } catch (error) {
            //message pops up if error 
            console.error('Error connecting to MongoDB Atlas:', error);
        }
    }

    async disconnect() {
        try {
            // Close the connection
            await this.client.close();
            console.log('Disconnected from MongoDB Atlas');
        } catch (error) {
            console.error('Error disconnecting from MongoDB Atlas:', error);
        }
    }

    
    //accessing customer collection********************************************************
    async insertCustomer(customerData) {
        try {
        //connection to collection after validation is checked
            const customersCollection = this.client.db('Mobile-Phone-Store-CRUD').collection('customers');
            // result waits for method first then inserts it, triggering a message in the console once done
            const result = await customersCollection.insertOne(customerData);
            console.log(`Inserted customer with _id: ${result.insertedId}`);
            return result.insertedId;
        } catch (error) {
            //error message 
            console.error('Error inserting customer:', error);
            return null;
        }
    }


    //accessing items collection*********************************************************
    async insertItems(itemsDataArray) {
        try {
            // Access the items collection
            const itemsCollection = this.client.db('Mobile-Phone-Store-CRUD').collection('items');
                const result = await itemsCollection.insertMany(itemsDataArray);
                console.log(`Inserted ${result.insertedCount} items`);
                return result.insertedIds; // Return an array of inserted IDs
        } catch (error) {
            console.error('Error inserting items:', error);
            return null;
        }
    }


    // accessing orders collection**********************************************************
async insertOrder(orderData) {
    try {
        // Access the orders collection
        const ordersCollection = this.client.db('Mobile-Phone-Store-CRUD').collection('orders');
        
        // Fetch item details for each item in the order
        const itemsCollection = this.client.db('Mobile-Phone-Store-CRUD').collection('items');
        const populatedItems = await Promise.all(orderData.items.map(async (item) => {
            const itemDetail = await itemsCollection.findOne({ _id: item.itemId });
            return { ...item, itemDetail };
        }));

        //Insert the order document with populated item details
            const result = await ordersCollection.insertOne({ ...orderData, items: populatedItems });
            console.log(`Inserted order with ID: ${result.insertedId}`);
            return result.insertedId;
    } catch (error) {
        console.error('Error inserting order:', error);
        return null;
    }
}

    // Add more methods for other CRUD operations as needed


async deleteRecentCust() {
    try {
        // Access the collection and find the document with the maximum _id
        const collection = this.client.db('Mobile-Phone-Store-CRUD').collection('customers');
        const lastDocument = await collection.findOne({}, { sort: { _id: -1 } });

        // Check if a document was found
        if (!lastDocument) {
            console.error('Error: No documents found in the collection.');
            return;
        }

        // Delete the last document
        const result = await collection.deleteOne({ _id: lastDocument._id });
        console.log(`Deleted last document with _id: ${lastDocument._id}`);

        return result;
    } catch (error) {
        console.error('Error deleting last document:', error);
        return null;
    }
}
}


//CREATE/ INSERT FUNCTION
async function main() {
    const db = new Database();
    await db.connect();

    //INSERTING CUSTOMER***********************************************************
    const customerData = {
        firstName: "Kate",
        lastName: "Demo",
        mobile: "2345678",
        email: "Kate@example.com",
        address_line1: "pouiyuyft",
        address_line2: " ",
        town: "Lucan",
        county_city: "Dublin",
        eircode: " "
    };
    
    // Validate specific fields (firstName, email, mobile)
    const requiredFields = ['firstName', 'email', 'mobile'];
    for (const field of requiredFields) {
        if (!customerData[field] || customerData[field].trim() === '') {
            console.error(`Error: ${field} field is required and cannot be empty.`);
            // return; // Stop further execution if any of the required fields are missing or empty
            process.exit(1); // Terminate the program immediately with exit code 1
        }
    }
    
    // If all required fields are valid, proceed with insertion
    const customerId = await db.insertCustomer(customerData);

    const itemsData = [
        { 
            manufacturer: '', 
            model: 'iPhone 13', 
            price: 999 
        },
        {
            manufacturer: 'Samsung', 
            model: 'Galaxy S13', 
            price: 799 
        }
    ];
    
    // Validate each item in the itemsData array
    for (const itemData of itemsData) {
        if (!itemData.manufacturer || !itemData.model || !itemData.price) {
            console.error('Error: Please provide values for manufacturer, model, and price for each item.');
            await db.deleteRecentCust(); //called function to delete the last customer, by indicating the latest customer_id
            process.exit(1); // Terminate the program immediately with exit code 1
        }
    }
    
    // If all items have required fields, proceed with insertion
    const item = await db.insertItems(itemsData);
    

    //INSERTING ORDER************************************************************
    const orderId = await db.insertOrder
    (
        { 
            customerId: customerId, 
            items: 
            [
                {
                    itemId: item[0],
                    quantity: 2,
                  },
                  {
                    itemId: item[1],
                    quantity: 1,
                  }
            ],
        }
    );

    await db.disconnect();
}

//calling main method
main();


/*
Database Design Overview:
In this database design, we have three collections: customers, orders, and items. The customers collection stores information about customers, while the orders collection represents customer orders, each containing an array of items. The items collection contains details of the products available for purchase. The orders collection references items by their unique IDs stored in the items collection, establishing a one-to-many relationship between orders and items.

Impact on Code Development:
The database design influenced the structure of our code by determining the methods and operations needed to interact with the database. For example, we implemented methods for CRUD operations for each entity (customers, orders, items) and used MongoDB operations like insertOne, insertMany, and aggregate to perform database operations. Additionally, we had to consider how to handle references between collections when inserting and querying data, leading to the inclusion of lookup operations to populate related data. Overall, the database design guided the development of our code architecture and data access logic.
*/


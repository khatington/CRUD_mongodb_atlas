const { MongoClient } = require('mongodb');

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
            console.log('************************************************');
            console.log('Connected to MongoDB Atlas !!');

        } catch (error) {
            //message pops up if error 
            console.log('************************************************');
            console.error('EEROR connecting to MongoDB Atlas:', error);
            console.log('************************************************');
        }
    }
    async disconnect() {
        try {
            // Close the connection
            await this.client.close();
            console.log('Disconnected from MongoDB Atlas !!');
            console.log('************************************************');
        } catch (error) {
            console.error('EEROR disconnecting from MongoDB Atlas:', error);
            console.log('************************************************');
        }
    }

    /*NOTE TO SELF: may not be as elegant, but what I noticed is as long as I mention a specific function then no other function 
    except the specified function will be triggered from other asyn functions, 
    either way there will be errors. */

/********************************************************************************************************************************************************************/

    /*  CREATE/INSERTION FOR CUSTOEMRS, ITEMS AND ORDERS******************************************************************************************************/
    //accessing customer collection********************************************************
    async  insertCustomer(customerData) {
        try {
        //connection to collection after validation is checked
            const customersCollection = this.client.db('Mobile-Phone-Store-CRUD').collection('customers');
            // result waits for method first then inserts it, triggering a message in the console once done
            console.log('************************************************');
            const result = await customersCollection.insertOne(customerData);
            console.log(`Inserted customer with ID: ${result.insertedId}`);
            console.log('************************************************');
            return result.insertedId;
        } catch (error) {
            //error message 
            console.log('************************************************');
            console.error('EEROR inserting customer:', error);
            console.log('************************************************');
            return null;
        }
    }


    //accessing items collection*********************************************************
    async  insertItems(itemsDataArray) {
        try {
            // Access the items collection
            const itemsCollection = this.client.db('Mobile-Phone-Store-CRUD').collection('items');
                const result = await itemsCollection.insertMany(itemsDataArray);
                console.log(`Inserted ${result.insertedCount} items`);
                console.log('************************************************');
                return result.insertedIds; // Return an array of inserted IDs
        } catch (error) {
            console.error('EEROR inserting items:', error);
            console.log('************************************************');
            return null;
        }
    }


    // accessing orders collection**********************************************************
    async  insertOrder(orderData) {
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
                console.log('************************************************');
                return result.insertedId;
        } catch (error) {
            console.error('EEROR inserting order:', error);
            console.log('************************************************');
            return null;
        }
    }

    //METHOD TO DELETE THE MOST RECENT CUSTOMER BY THEIR ID********************************
    async  deleteRecentCust() {
        try {
            // Access the collection and find the document with the maximum _id
            const collection = this.client.db('Mobile-Phone-Store-CRUD').collection('customers');
            const lastDocument = await collection.findOne({}, { sort: { _id: -1 } });

            // Check if a document was found
            if (!lastDocument) {
                console.error('EEROR: No documents found in the collection.');
                console.log('************************************************');
                return;
            }

            // Delete the last document
            const result = await collection.deleteOne({ _id: lastDocument._id });
            console.log(` !! Order has been CANCELLED for customer_id: ${lastDocument._id} !!`);
            console.log('************************************************');
            return result;

        } catch (error) {
            console.error('EEROR deleting last document:', error);
            console.log('************************************************');
            return null;
        }
    }

/********************************************************************************************************************************************************************/

    /* RETRIEVE/ GET FOR CUSTOEMRS, ITEMS AND ORDERS***************************************************************************************************************/
    async retrieveCollections(input, field, collection) {
        try {
            // Accessing specified collection
            const currentCollection = this.client.db('Mobile-Phone-Store-CRUD').collection(collection);

            /**
             * Declare query
             * Found out through mongodb that square brackets create a dynamic query 
             * the regex is to make the query non case sensitive, it'll match the input to the field no matter if its caps or not
             */
            const query = { [field]: { $regex: `.*${input}.*`, $options: 'i' } };


            // Find documents that match the query
            const result = await currentCollection.find(query).toArray();

            //print if there is data found
            console.log('************************************************');
            if(result.length === 0)
            {
                console.log(`No document was found with ${field}: '${input}' `)
            }
            else
            {
                console.log(`Retrieved documents with the ${field}: '${input}'`, result);
            }
            console.log('************************************************');

            // Return the retrieved documents
            return result;
        } catch (error) {
            // Error handling
            console.error('Error retrieving documents:', error);
            console.log('************************************************');
            return null;
        }
    }

/********************************************************************************************************************************************************************/

    /* RETRIEVE/ GET THE ENTIRE DATABASE *************************************************************************************************************************/
    async retrieve()
    {
        try
        {
                //Accessing all three collections
                const customersCollection = this.client.db('Mobile-Phone-Store-CRUD').collection('customers');
                const itemsCollection = this.client.db('Mobile-Phone-Store-CRUD').collection('items');
                const ordersCollection = this.client.db('Mobile-Phone-Store-CRUD').collection('orders'); 

               // Retrieve all documents from all the collections
               const customers = await customersCollection.find({}).toArray();
               const items = await itemsCollection.find({}).toArray();
               const orders = await ordersCollection.find({}).toArray();
    
               // Print or process the retrieved documents
               console.log('************************************************');
               console.log("Retrieved customers:", customers);
               console.log('************************************************');
               console.log("Retrieved items:", items);
               console.log('************************************************');
               console.log("Retrieved orders:", orders);
               console.log('************************************************');

               //NOTE: I didnt get to solve the items array in the collection item, so they will display as object object instead of the details
       
               // Return the retrieved customers
               return customers;
           } catch (error) {
               console.error("Error retrieving customers:", error);
               return null;
           }
    }
/********************************************************************************************************************************************************************/
}



/********************************************************************************************************************************************************************/
//MAIN METHOD FUNCTION USED TO SPECIFY CRUD OEPRATIONS*****************************************************
async function main()
{
    let createOperation = false;
    let retrieveOperation = false;
    let updateOperation = false; 
    let deleteOperation = false; 
 
    //each CRUD operation with specified function called
    if (createOperation) {
        mainCreate();
    } 
    else if (retrieveOperation) {
        mainRetrieve(); 

    } 
    else if (updateOperation) {

    } 
    else if (deleteOperation) {

    } 
    else {
        //default operation: retrieving the entire database
        retrieveDatabase(); 
        
    }
}
/********************************************************************************************************************************************************************/



/********************************************************************************************************************************************************************/
//CREATE/ INSERT FUNCTIONS****************************************************************************************
async function mainCreate() {
    const db = new Database();
    await db.connect();

    //INSERTING CUSTOMER***********************************************************
    const customerData = {
        title: "Mr.",
        firstName: "Vlake",
        lastName: "Connor",
        mobile: 2345678,
        email: "v.connor@example.com",
        address_line1: "123 Milestone Brick ",
        address_line2: " ",
        town: "Palmerstown",
        county_city: "Dublin",
        eircode: " "
    };
    
    // Validate specific fields (firstName, email, mobile)
    const requiredFields = ['firstName', 'lastName', 'email', 'mobile', 'address_line1', 'town', 'county_city'];
    for (const field of requiredFields) {
        //REFERENCE: mongodb about operations and stackover flow
        //hasOwnProperty to check if field exists and all fields turned into strings, especially for mobile, to check if theres a value after trim. 
        if (!customerData.hasOwnProperty(field) || customerData[field].toString().trim() === '') {
            console.log('************************************************');
            console.error(`EEROR: ${field} field is required and cannot be empty.`);
            console.log('************************************************');
            process.exit(1); // Terminate the program immediately with exit code 1
        }
    }
    //this function will occurs once insertCustomer occurs
    const customerId = await db.insertCustomer(customerData);

    //INSERTING ITEMS************************************************************************
    const itemsData = [
        { 
            manufacturer: 'EXAMPLEEE', 
            model: 'Iphone 13', 
            price: 999 
        },
        {
            manufacturer: 'EXAMPLE 2', 
            model: 'Galaxy S13', 
            price: 799
        }
    ];


    for (let i = 0; i < itemsData.length; i++) {
        const item = itemsData[i];
        
        // Check if any of the required fields are empty by using trim
        //Had to do this way because arrays are just difficult
        if (!item.manufacturer.trim() || !item.model.trim() || !item.price.toString().trim()) {
            console.error(`EEROR: Manufacturer, model, and price fields are required for each item.`);
            console.log('************************************************');
            await db.deleteRecentCust(); // method to the last customer, in a way to cancel the order
            process.exit(1); // Terminate the program immediately with exit code 1
        }
    }


    //this function will occur onces insertItems occurs
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

    //disconnect from mongodb atlas
    await db.disconnect();
}
/********************************************************************************************************************************************************************/

//RETRIEVE/ GET FUNCTIONS*****************************************************************************************
async function mainRetrieve() {
    const db = new Database();
    await db.connect();

    /**
     * constructing query here and transferring it to the function retrieveCustomer
     * Decided to do this as it was much simpler to hard code the input without having to scroll for different functions for each collection
     * only does a basic find function
     * doesnt really work on orders to be honest :///
     */
    const field = "lastName"; // Specified field
    const collection = 'customers'; // Specified collection
    const input = "harper"; // Specified query input

    //Calls retrieveCustomer method with the parameters
    await db.retrieveCollections(input, field, collection);

    //disconnects from database
    await db.disconnect();
}


/**FUNCTION TO RETRIEVE ENITRE DATABASE******************************************************************************
 * creates a new object based on the class Database(), then awaits on each function.  
 * NOTE: probably a better way to do this but I kept getting errors, so I decided to do this instead
*/
async function retrieveDatabase()
{
    const db = new Database();
    await db.connect();
    await db.retrieve(); //the function that'll retrieve everything
    await db.disconnect();

}

//calling the main method to start program 
main(); 

/*
Database Design Overview:
In this database design, we have three collections: customers, orders, and items. The customers collection stores information about customers, while the orders collection represents customer orders, each containing an array of items. The items collection contains details of the products available for purchase. The orders collection references items by their unique IDs stored in the items collection, establishing a one-to-many relationship between orders and items.

Impact on Code Development:
The database design influenced the structure of our code by determining the methods and operations needed to interact with the database. For example, we implemented methods for CRUD operations for each entity (customers, orders, items) and used MongoDB operations like insertOne, insertMany, and aggregate to perform database operations. Additionally, we had to consider how to handle references between collections when inserting and querying data, leading to the inclusion of lookup operations to populate related data. Overall, the database design guided the development of our code architecture and data access logic.
*/


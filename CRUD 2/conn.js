const { MongoClient } = require('mongodb');

//establishing mongoDB Atlas connection 
const uri = "mongodb+srv://u230544:keejei2Kou4ue6He@cs230-u230544.hiuzfq0.mongodb.net/?retryWrites=true&w=majority&appName=cs230-u230544";

//creating class
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
    async insertCustomer(customerData) {
        try {
        //connection to collection after validation is checked
            const customersCollection = this.client.db('Mobile-Phone-Store-CRUD').collection('customers');

            //result stores once the operation to insert values is done
            const result = await customersCollection.insertOne(customerData);
            console.log('************************************************');
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
            //similar to insertCustomer
                const result = await itemsCollection.insertMany(itemsDataArray);
                console.log('************************************************');
                console.log(`Inserted ${result.insertedCount} items`);
                console.log('************************************************');
                return result.insertedIds; // Return an array of inserted IDs
        } catch (error) {
            console.log('************************************************');
            console.error('EEROR inserting items:', error);
            console.log('************************************************');
            return null;
        }
    }


    // accessing orders collection**********************************************************
    async insertOrder(orderData, index) {
        try {
            // Access the orders and items collections
            const ordersCollection = this.client.db('Mobile-Phone-Store-CRUD').collection('orders');
            const itemsCollection = this.client.db('Mobile-Phone-Store-CRUD').collection('items');
    
            //find phone's itemID in items collection by specified index made by user
            const item = await itemsCollection.findOne({}, { skip: index, limit: 1 });

            if (!item) {
                // Handle case where item is not found
                console.error(`Item at index ${index} not found.`);
                return null;
            }
    
            //Insert the order document with the item details
            const result = await ordersCollection.insertOne({ customerId: orderData.customerId, item });
            console.log(`Inserted order with ID: ${result.insertedId}`);
            console.log('************************************************');
            return result.insertedId;
        } catch (error) {
            console.error('Error inserting order:', error);
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

    /* UPDATE/ POST NEW DOCUMENTS***************************************************************************************************************/
    async updateDocument(input, field, collection, index) {
        try {
            /**Similar to retrieveCollections(), however the difference is that it takes in an index to update a specified documet in the collect */
            //Accessing the specified collection
            const currentCollection = this.client.db('Mobile-Phone-Store-CRUD').collection(collection);
    
            //Find document at the specified index
            const document = await currentCollection.findOne({}, { skip: index, limit: 1 });
            if (!document) {
                // Handle case where item is not found
                console.error(`Document at index ${index} not found.`);
                return null;
            }

            //define the query with storing the specified document
            const query = { _id: document._id };
    
            // Define the update operation based on the field and input parameters
            const update = { $set: { [field]: input } };
    
            //perform update operation
            const result = await currentCollection.updateOne(query, update);
    
            //if no result, then message and if successful, print other message
            if (result.modifiedCount === 0) {
                console.log(`No document was updated with ${field}: '${input}'`);
            } else {
                console.log('************************************************');
                console.log(`Document with ID ${document._id} at index ${index} had their ${field} updated to ${input} successfully !!`);
                console.log('************************************************');
            }
            return result.modifiedCount;
            //error handling
        } catch (error) {
            console.error('Error updating documents:', error);
            console.log('************************************************');
            return null;
        }
    }
    

/********************************************************************************************************************************************************************/

    //METHOD TO DELETE THE DOCUMENTS AND DELETE IF THERES DUPLICATES*****************************************************************************************/
    async deleteDocument(input, field, collection) {
        try {
            // Accessing specified collection
            const currentCollection = this.client.db('Mobile-Phone-Store-CRUD').collection(collection);

            /**
             * Similar to retrieveCollections() as well, however it finds the duplicates and deletes them too
             */
            const query = { [field]: { $regex: `.*${input}.*`, $options: 'i' } };

            // Find and delete duplicate documents that match the query
            const duplicateDocs = await currentCollection.find(query).toArray();
            let totalDeleted = 0;

            //if there are more than one, then...
            if (duplicateDocs.length > 0) {
                // Remove duplicates
                for (const doc of duplicateDocs) {
                    await currentCollection.deleteOne({ _id: doc._id });
                    totalDeleted++; //counter to count deleted
                }
                //message that includes the number of documents deleted and the query
                console.log('************************************************');
                console.log(`Deleted ${totalDeleted} duplicate documents matching ${field}: '${input}'`);
                console.log('************************************************');
            } else {
                console.log('************************************************');
                console.log(`No duplicate documents found with ${field}: '${input}'`);
                console.log('************************************************');
            }

            // Return the number of deleted documents
            return totalDeleted;
        } catch (error) {
            // Error handling
            console.error('Error deleting duplicate documents:', error);
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

               //Retrieve all documents from all the collections using the find operation
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
        mainUpdate(); 
    } 
    else if (deleteOperation) {
        mainDelete(); 
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
    //delcare a new class object and connect to database
    const db = new Database();
    await db.connect();

    let customerOrders = true; //acts a switch so if customer wants to order, insert new customer and their order, if not insert new product or dont ://

    if(customerOrders)
    {
        //INSERTING CUSTOMER***********************************************************
        const customerData = {
            //test out the validation and then test out insert
            // title: "Miss",
            // firstName: " ",
            // lastName: "Omara",
            // mobile: 1234567,
            // email: "omara.a@example.ie",
            // address_line1: "123 Yellow Brick",
            // address_line2: "",
            // town: "Blanchardstown",
            // county_city: "Dublin",
            // eircode: "K23WQ09"

            //something to find, ie lastName
            // title: "Mister",
            // firstName: "Connor",
            // lastName: "Omara",
            // mobile: 1234567,
            // email: "connor.omara@example.ie",
            // address_line1: "123 Yellow Brick",
            // address_line2: "",
            // town: "Blanchardstown",
            // county_city: "Dublin",
            // eircode: "K23WQ09"

           // something to insert twice for duplicates and delete
            // title: "delete",
            // firstName: "delete ",
            // lastName: "delete",
            // mobile: 1234567,
            // email: "delete",
            // address_line1: "delete",
            // address_line2: "",
            // town: "delete",
            // county_city: "delete",
            // eircode: "delete"
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
        //perform insert in insertCustomer() 
        const customerId = await db.insertCustomer(customerData);


        //INSERTING ORDER************************************************************
        let index = Math.floor(Math.random() * 10); //choses a number between 0 and 9, which determines what phone the customer orders
        const orderData = {
            customerId: customerId,

            //NOTE: it can only handle one object in the item array, the function insertOrder only handles one find query for the index and not the 2nd
            item: 
            [
                {itemId: index , quantity: 2},
                // {itemId: index + 1, quantity: 1}
            ]
        }
        await db.insertOrder(orderData, index); 
        await db.disconnect(); 
    }

    else
    {
        //INSERTING ITEMS************************************************************************
        /**
         * 
         * Again, there is probably a better way but I decided to just determine the way it is checked by the array size
         * if size === 1, then do the validation used in customers, if not then validate through an array method
         * default: if size === 0, then it wont insert anything and temrinates program
         * foud this through geeks4geeks
         */
        const itemsData = [
            { 
                manufacturer: 'Apple', 
                model: 'Iphone 13', 
                price: 1000  
            },
            {
                manufacturer: 'Samsung', 
                model: 'Galaxy S14 Ultra ', 
                price: 400
            },
            { 
                manufacturer: 'Huawei', 
                model: 'P30 Pro', 
                price: 500  
            },
            {
                manufacturer: 'Apple', 
                model: 'Iphone X ', 
                price: 250
            },
            { 
                manufacturer: 'Oppo', 
                model: 'Reno 10 Pro Plus', 
                price: 568.34   
            },
            {
                manufacturer: 'Samsung', 
                model: 'Galaxy A15 ', 
                price: 219.5
            },
            { 
                manufacturer: 'Google', 
                model: 'Pixel 8', 
                price: 850.80  
            },
            {
                manufacturer: 'Xiomi', 
                model: 'Mi 10 Pro', 
                price: 946
            },
            { 
                manufacturer: 'Apple', 
                model: 'Iphone 11', 
                price: 239.5  
            },
            {
                manufacturer: 'Samsung', 
                model: 'Z Flip', 
                price: 1200
            }
            
        ];

        // Get the length of the array 
        const size = itemsData.length; 

        //From stackover flow:  process.exit(1) used because I was getting errors, there's probably a better way but I decided to do this
        if(size === 0)
        {
            console.log('************************************************');
            console.log(`No product was inserted!!`);
            console.log('************************************************');
            process.exit(1); // Terminate the program immediately with exit code 1
        }
        else
        {
            if (size === 1) {
                // Validate specific fields (manufacturer, model, price)
                const requiredFields = ['manufacturer', 'model', 'price'];
                for (const field of requiredFields) {
                    // Check if the field exists and is not empty after trimming
                    if (!itemsData[0].hasOwnProperty(field) || itemsData[0][field].toString().trim() === '') {
                        console.log('************************************************');
                        console.error(`ERROR: ${field} field is required and cannot be empty.`);
                        console.log('************************************************');
                        process.exit(1); 
                    }
                }
            } else { 
                // Iterate through the array and validate each item
                for (let i = 0; i < itemsData.length; i++) {
                    const item = itemsData[i];

                    // Check if any of the required fields are empty by using trim
                    if (!item.manufacturer.trim() || !item.model.trim() || !item.price.toString().trim()) {
                        console.log('************************************************');
                        console.error(`ERROR: Manufacturer, model, and price fields are required for each item.`);
                        console.log('************************************************');
                        process.exit(1); 
                    }
                }
            }
        }
    
        // Insert items into the database if they are validated
        await db.insertItems(itemsData);
        await db.disconnect(); 
    }
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
     * doesnt really work on any arrays or numbers to be honest :///
     */
    const field = "lastName"; // Specified field
    const collection = 'customers'; // Specified collection
    const input = "omara"; // Specified query input

    //Calls retrieveCustomer method with the parameters
    await db.retrieveCollections(input, field, collection);

    //disconnects from database
    await db.disconnect();
}
/********************************************************************************************************************************************************************/

//RETRIEVE/ GET FUNCTIONS*****************************************************************************************
async function mainUpdate() {
    const db = new Database();
    await db.connect();

    /**
     * Same idea here 
     * NOTE: doesnt work on the orders properly, especially for the items array in orders document and for input being an int
     */
    const field = "title"; // Specified field
    const collection = 'customers'; // Specified collection
    const input = "Mrs."; // Specified query input
    let index = 0; //though be aware, it starts at 0.

    //Calls retrieveCustomer method with the parameters 
    await db.updateDocument(input, field, collection, index);

    //disconnects from database
    await db.disconnect();
}
/********************************************************************************************************************************************************************/

//DELETE/ REMOVE FUNCTIONS*****************************************************************************************

async function mainDelete()
{
    const db = new Database();
    await db.connect();

    /**
     * Copy and pasted from mainRetrieve() function 
     * does a simple find query and deletes it
     * deleteDocument() is similar to the retrieve but it also deletes its duplicates
     * NOTE: doesnt work on orders properly, especially for the items arrray, and for input being a number
     */
    const field = "firstName"; // Specified field
    const collection = 'customers'; // Specified collection
    const input = "delete"; // Specified query input

    //Calls retrieveCustomer method with the parameters
    await db.deleteDocument(input, field, collection);

    //disconnects from database
    await db.disconnect();
}
/********************************************************************************************************************************************************************/

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

//calling the main method to start program and CRUD operations
main(); 


/**REFEENCES 
 * any mongodb web, youtube videos and stackover flow answers I can find :///
 */

/**BUGS/ ERRORS/ MISSING OPERATIONS I NOTED 
 * Indexes start at 0 and not at 1
 * A lot of the RUD queries don't work with arrays like the item array in orders and for any int values 
 * 
 * In orderData, item cannot have multiple objects in it as the function insertOrder ignores the second object due to unique indexes. 
 * A lot of the operations generally do the most simple CRUD operations. :///
 * 
 * In the delete operation, even if it deletes a document or duplicates ie in customers, it wont delete its connecting order
 * --only does the most basic
 * 
*/

/**MY CODE STRUCTURE
 * CRUD operations are determined by boolean values
 * ---if not CRUD operation is chosen, it'll retrieve the entire database by default
 * 
 * Inserting products are also determined by the boolean value 
 * ---if you want to insert customer, an order has to be made 
 * ---else if you dont, a product will be made by
 * ---else if no product values inserted, program ends
 */

/**DATABASE DESIGN OVERVIEW 
 * In the database, there is 3 collections: customers, items and orders. 
 * NOTE: see I wasnt completely sure whether to make a collection for shipping and address so I put them all into the customers 
 * CUSTOMERS COLLECTION: stores information about the customers 
 * 
 * ORDERS COLLECTION: Acts as the receipt, every time you make insert a new customer, an order has to be created too
 * --in the documents, includes the customer id, the quantity of the item and then references the unique id and details of the item stored by items collection.
 * 
 * ITEMS COLLECTION: contians details of the products available for purchase. 
*/

/**IMPACT ON CODE DEVOLPEMENT
 * The design of my database influenced my code structure a lot because, of how I needed to always access other collections 
 * in order to get their objectIds as well as using a lot of built in MongoDB operations or operations similar to them like insertOne,
 * insertMany, and aggregate to perform basic CRUD opertations. 
 * Overall, there's definitely a better way to do this, I just chose the difficult path here but it did help me understood no SQL and 
 * using MongoDb itself.
 */

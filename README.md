#CMC Upload Microservice Development

##Installing

###1) Install Mocha (for testing):

    sudo npm install -g mocha

###2) Install apiDoc (for API docs):

    sudo npm install -g apidoc

###3) Install all dependencies
    
    npm install


##Running Tests

    npm test
    

##Generating API documentation

    apidoc -i ./routes -o apidoc


##Running Application

In *development* mode, run (Application run as open API without token authentication):

    $ NODE_ENV=dev npm start
    OR
    $ NODE_ENV=dev PORT=3000 npm start    

In production mode, run:

    $ npm start
    OR
    $ PORT=3000 npm start    
      

To Run Application as open API without token authentication (recommended only for test)

    $ PORT=3000 NODE_ENV=dev npm start
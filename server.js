const mongo = require('mongodb').MongoClient;
const io = require('socket.io').listen(4000).sockets;

mongo.connect('mongodb://127.0.0.1:27017/',function(err,client){

    if(err)
    throw err;

    console.log("MongoDB successfully connected");
    io.on('connection',function(socket){
        let chat = client.db('mongochat').collection('chats');

        // Create function to send status
        sendStatus = function(s){
            socket.emit('status',s)
        }

        // Get chats from mongo collection
        chat.find().limit(100).sort({_id:1}).toArray(function(err,res){
            if(err)
                throw err;

            // Emit the messages
            socket.emit('output',res);
        });

        // Handle Input events
        socket.on('input',function(data){
            let name = data.name;
            let message = data.message;

            if(name=='' || message=='')
            {
                sendStatus('Please enter a name and message');
            }
            else
            {
                // Insert message
                chat.insert({name:name, message:message},function(){
                    io.emit('output',[data]);
                    sendStatus({
                        message: 'Message Sent',
                        clear: true
                    })
                });
            }
        });

        socket.on('clear', function(data){
            // Remove all chats from collection
            chat.remove({},function(){
                socket.emit('cleared');
            });
        });

    });
})
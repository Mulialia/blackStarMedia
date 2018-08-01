/*
* Request handlers
*
*/

// Dependencies
const _data = require('./data');
const helpers = require('./helpers');
// Define handlers
const handlers = {};

// Users
handlers.users = function(data,callback){
	const acceptableMethods = ['post','get','put','delete'];
	if (acceptableMethods.indexOf(data.method) > -1) {
		handlers._users[data.method](data,callback);
	} else {
		callback(405);
	}
};

// Container for the users submethods
handlers._users = {};

// Users - post
// Required data: firstname, lastname, phone, password, tosAgreement
// Optional data: none
handlers._users.post = function(data,callback){
	// Check that all required fileds are filled out
	const firstname = typeof(data.payload.firstname) == 'string' && data.payload.firstname.trim().length > 0 ? data.payload.firstname.trim() : false;
	const lastname = typeof(data.payload.lastname) == 'string' && data.payload.lastname.trim().length > 0 ? data.payload.lastname.trim() : false;
	const phone = typeof(data.payload.phone) == 'string' && data.payload.phone.trim().length == 10 ? data.payload.phone.trim() : false;
	const password = typeof(data.payload.password) == 'string' && data.payload.password.trim().length > 0 ? data.payload.password.trim() : false;
	const tosAgreement = typeof(data.payload.tosAgreement) == 'boolean' && data.payload.tosAgreement == true ? true : false;

	if (firstname && lastname && phone && password && tosAgreement) {
		// Make sure that the user doesnt already exist
		_data.read('users',phone,function(err,data){
			if (err) {
				// Hash the password
				const hashedPassword = helpers.hash(password);

				// Create the user object
				if (hashedPassword) {
					const userObject = {
						'firstname': firstname,
						'lastname': lastname,
						'phone': phone,
						'hashedPassword': hashedPassword,
						'tosAgreement': true
					};

					// Store the user
					_data.create('users',phone,userObject,function(err){
						if(!err){
							callback(200);
						} else {
							console.log(err);
							callback(500,{'Error': 'Could not create the new user'});
						}
					});
				} else {
					callback(500,{'Error': 'Could not hash the user\'s password'});
				}
			} else {
				// User already exists
				callback(400,{'Error': 'A user with that phone number already exists'});
			}
		});
	} else {
		callback(400, {'Error': 'Missing required fields'});
	}
};

// Users - get
// Required data: phone
// Optional data: none
// @TODO Only let an authenticated user access their object. Don't let them access anyone else's objects
handlers._users.get = function(data,callback){
	// Check that the phone number is valid
	const phone = typeof(data.queryStringObject.phone) == 'string' && data.queryStringObject.phone.trim().length == 10 ? data.queryStringObject.phone.trim() : false;
	if (phone) {
		_data.read('users',phone,function(err,data){
			if (!err && data) {
				// Remove the hashed password from the user object before returning to the requester
				delete data.hashedPassword;
				callback(200,data);
			} else {
				callback(404);
			}
		});
	} else {
		callback(400, {'Error': 'Missing required field'});
	}
};

// Users - put
// Required data: phone
// Optional data: firstname, lastname, password (at least one must be specified)
// @TODO Only let an authenticated user update their own object. Don't let them update anyone else's
handlers._users.put = function(data,callback){
	// Check for the required field
	const phone = typeof(data.payload.phone) == 'string' && data.payload.phone.trim().length == 10 ? data.payload.phone.trim() : false;

	// Check for the optional fields
	const firstname = typeof(data.payload.firstname) == 'string' && data.payload.firstname.trim().length > 0 ? data.payload.firstname.trim() : false;
	const lastname = typeof(data.payload.lastname) == 'string' && data.payload.lastname.trim().length > 0 ? data.payload.lastname.trim() : false;
	const password = typeof(data.payload.password) == 'string' && data.payload.password.trim().length > 0 ? data.payload.password.trim() : false;
	
	// Error if the phone is invalid
	if (true) {
		// Error if nothing is sent to update
		if (firstname || lastname || password) {
			// Look up user
			_data.read('users',phone,function(err,userData){
				if (!err && userData) {
					// Update the necessary fields
					if (firstname) {
						userData.firstname = firstname;
					}
					if (lastname) {
						userData.lastname = lastname;
					}
					if (password) {
						userData.hashedPassword = helpers.hash(password);
					}
					// Store the new updates
					_data.update('users',phone,userData,function(err){
						if (!err) {
							callback(200);
						} else {
							console.log(err);
							callback(500,{'Error':'Could not update the user'});
						}
					});
				} else {
					callback(400,{'Error':'The specified user does not exist'});
				}
			});
		} else {
			callback(400,{'Error':'Missing fields to update'});
		}
	} else {
		callback(400,{'Error': 'Missing required field'});
	}
};

// Users - delete
// Required filed: phone
// @TODO Only let an authenticated user delete their object. Dont let them delete anyone else's
// @TODO Cleanup (delete) any other data files associted with this user
handlers._users.delete = function(data,callback){
	// Check that the phone number is valid
	const phone = typeof(data.queryStringObject.phone) == 'string' && data.queryStringObject.phone.trim().length == 10 ? data.queryStringObject.phone.trim() : false;
	if (phone) {
		_data.read('users',phone,function(err,data){
			if (!err && data) {
				// Delete the specified user
				_data.delete('users',phone,function(err){
					if (!err) {
						callback(200) ;
					} else {
						callback(500,{'Error':'Could not deletethe specified user'});
					}
				});
			} else {
				callback(400,{'Error':'Could not find the specified user'});
			}
		});
	} else {
		callback(400, {'Error': 'Missing required field'});
	}
};

// Tokens
handlers.tokens = function(data,callback){
	const acceptableMethods = ['post','get','put','delete'];
	if (acceptableMethods.indexOf(data.method) > -1) {
		handlers._tokens[data.method](data,callback);
	} else {
		callback(405);
	}
};

// Container for all the token methods
handlers._tokens = {};

// Tokens - get
// Required data: id
// Optional data: none
handlers._tokens.get = function(data,callback){
	// Check that the id is valid
	const id = typeof(data.queryStringObject.id) == 'string' && data.queryStringObject.id.trim().length == 20 ? data.queryStringObject.id.trim() : false;
	if (id) {
		// Lookup the token
		_data.read('tokens',id,function(err,tokenData){
			if (!err && tokenData) {
				callback(200,tokenData);
			} else {
				callback(404);
			}
		});
	} else {
		callback(400, {'Error': 'Missing required field'});
	}
};

// Tokens - post
// Required data: phone, password
// Optional data: none
handlers._tokens.post = function(data,callback){
	const phone = typeof(data.payload.phone) == 'string' && data.payload.phone.trim().length == 10 ? data.payload.phone.trim() : false;
	const password = typeof(data.payload.password) == 'string' && data.payload.password.trim().length > 0 ? data.payload.password.trim() : false;
	if (phone && password) {
		// Lookup the user who matches that phonenumber
		_data.read('users',phone,function(err,userData){
			if (!err && userData) {
				// Hash the sent password and compared it to the password stored in the user object
				const hashedPassword = helpers.hash(password);
				if (hashedPassword == userData.hashedPassword) {
					// If valid , create a valid token with a random name. Set expiration date 1 hour in the future
					const tokedId = helpers.createRandomString(20);
					const expires = Date.now() + 1000 * 60 * 60;
					const tokenObject = {
						'phone': phone,
						'id': tokedId,
						'expires': expires
					};

					// Store the token
					_data.create('tokens',tokedId,tokenObject,function(err){
						if (!err) {
							callback(200,tokenObject);
						} else {
							callback(500,{'Error':'Could not create the new token'});
						}
					});
				} else {
					callback(400,{'Error':'Password did not match the specified users stored password'});
				}
			} else {
				callback(400,{'Error':'Could not find the specified user'});
			}
		});
	} else {
		callback(400,{'Error': 'Missing required filed(s)'});
	}
};

// Tokens - put
handlers._tokens.put = function(data,callback){

};

// Tokens - delete
handlers._tokens.delete = function(data,callback){

};

// Ping handler
handlers.ping = function(data,callback){
	callback(200);
};

// Not found
handlers.notFound = function(data,callback){
	callback(404);
};

// Export the module
module.exports = handlers;
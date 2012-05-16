// old atempts, left for some ideas


User = typedef({
	id:
	name:
	username:
});

// warn about unused args
// warn about 404s

// try non-declarative way!
// start from single url definition

// result (or message) format:
{
	meta: {
		httpResponseCode: Number
	},
	error: Object, // usually an exception thrown
	data: Object,
	objects: {
		Object: Object, // id-to-object map of referenced objects
	}
}
// any object can have _type property, indicating type
// api method can return:
new HintedResult({
	data: Object,
	objects: {
		objectTypeString: {
			objectId: object
		}
	},
	objectIds: {
		objectTypeString: [objectsId,]
	}
}) // to hint upper middleware to provide referenced objects along with response
var unwrap = function(possibleHinted) {
	if (possibleHinted instanceof HintedResult)
	{
		return possibleHinted.data;
	}

	return possibleHinted;
}

// possible errors list
// multiple queries in one sharing common dict of referenced objects

{
	path: 'user', // list of users
	req: [auth],
	opt: {read: [range]},
		read:   [User.username.opt, {_returns: List(User._short)}],
		update: [User.except('password'), {_returns: User.id}],

	code: require('./api/user').UserList
}

{
	path: 'user/:id', // particular user
		args: {id: User.id},
	req: [auth],
		read:   {_returns: User.except('password')},
		update: User.except('email', 'password'),
		del:	{},
			props: [User.username, User.name],

	code: require('./api/user').User
}

{
	path: 'user/:id/email', // user's email
		args: {id: User.id},
	req: [auth, secure],
		call: [ctx.authInfo, args.id,
				User.email, User.password],

	code: require('./api/user').User.updateEmail,
}

var DoubleDict = function() {
	this.dict = {};
	this.count = 0;
};

DoubleDict.prototype.get = function(key, createIfNotExists) {
	var result = this.dict[key];

	if (result == null)
	{
		result = {};
		if (createIfNotExists)
		{
			this.dict[key] = result;
		}
	}

	return result;
};

DoubleDict.prototype.add = function(key, subKey, object) {
	if (!(key in this.dict))
	{
		this.count++;
	}
	this.get(key, true)[subKey] = object;
};

DoubleDict.prototype.remove = function(key, subKey) {
	var objects = this.get(key);

	delete objects[subKey];
	if (this.isEmpty(objects))
	{
		delete this.dict[key];
		this.count--;
	}
};

DoubleDict.prototype.isEmpty = function (dict) {
	var result = true;
	for (var k in dict)
	{
		result = false;
		break;
	}
	return result;
};


module.exports = DoubleDict;

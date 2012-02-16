var DoubleDict = function() {
	this.dict = {};
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
	this.get(key, true)[subKey] = object;
};

DoubleDict.prototype.remove = function(key, subKey) {
	var objects = this.get(key);

	if (objects.length > 0)
	{
		delete objects[subKey];
		if (objects.length == 0)
		{
			delete this.objects[key];
		}
	}
};


module.exports = DoubleDict;

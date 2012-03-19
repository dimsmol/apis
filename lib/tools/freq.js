var Freq = function (frameSize) {
	this.frameSize = (frameSize == null ? 60 * 1000 : frameSize);

	this.maxSlotCount = 2;
	this.start = null;

	this.counts = [];
};

Freq.prototype.getCurr = function () {
	var now = Date.now();
	return Math.floor(now / this.frameSize);
};

Freq.prototype.getAverage = function () {
	var result = 0;
	if (this.counts.length > 0)
	{
		var curr = this.getCurr();
		if (curr <= this.start + this.maxSlotCount - 1)
		{
			result = this.counts[0];
		}
	}
	return result;
};

Freq.prototype.update = function () {
	var curr = this.getCurr();
	if (this.start == null)
	{
		this.start = curr;
	}

	var i = curr - this.start;
	var shift = i - this.maxSlotCount + 1;

	if (shift > 0)
	{
		if (shift >= this.maxSlotCount)
		{
			this.start = curr;
			this.counts = [];
			i = 0;
		}
		else
		{
			this.start += shift;
			this.counts.splice(0, shift);
			i -= shift;
		}
	}

	if (this.counts.length <= i)
	{
		this.counts[i] = 1;
	}
	else
	{
		this.counts[i]++;
	}
};


module.exports = Freq;

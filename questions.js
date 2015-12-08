var testVar = testFunc(["one", "two", "three"]);l

function testFunc(testValues) {
	var localObject = Object.create(null);
	var i = 0;
	function handler() {
		localObject[i] = testValues[i];
		i++;
	}
	addEventListener("click", handler);
	return localObject;
}
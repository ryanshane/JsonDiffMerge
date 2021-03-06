// EXAMPLES:

// NOTE: Array entries must have a unique ID. By default it will be discovered if it is "id", "uid" or "date". 
// If not then you can pass in an object mapping array names to primary key field names (see jsonDiff function comments for all details)
var originalData = {"actionHistory":[{"type":"Submit","title":"Request submitted","description":"Saved stage Draft","userLoginName":"testa@abc.com.au","userDisplayName":"Test A","date":"2021-12-20T04:21:38.125Z"}],"dateSubmitted":"2021-12-20T04:20:35.287Z","containerEntries":[{"id":"1","details":"details"},{"id":"2","details":"details 2"}],"equipmentEntries":[],"deliveryDate":"","resources":[{"title":"Supervisor","id":"Supervisor","amount":0},{"title":"Fitter","id":"Fitter","amount":0},{"title":"Boilermaker","id":"Boilermaker","amount":0},{"title":"Rigger","id":"Rigger","amount":0},{"title":"Electrician","id":"Electrician","amount":0},{"title":"Instrumentation Tech.","id":"Instrumentation Tech.","amount":0},{"title":"CSC","id":"CSC","amount":0},{"title":"Specialised Resources","id":"Specialised Resources","amount":0}],"equipments":[{"title":"Crane","id":"Crane","amount":""},{"title":"EWP","id":"EWP","amount":""},{"title":"Scaffold","id":"Scaffold","amount":""},{"title":"Special tools","id":"Special tools","amount":""}],"area":"AC","Requestor":"testa@abc.com.au","Submitter":"testa@abc.com.au","requestorOffice":"Melbourne Office","requestorManager":"testb@abc.com.au","requestorEmail":"testa@abc.com.au","requestorPhone":"","requestorPosition":"Consultant","requestorDepartment":"IT","requestType":"Add Late Work","canBeDoneOutsideShutdown":"Yes","wo":32423423,"revision":"REV 23333","description":"test","work":"Mechanical","location":"Functional location","areaApproverId":3,"effectSafety":"Yes","effectReliability":"Yes","justification":"Testing","osApproval":"","lastAction":{"type":"Submit","title":"Request submitted","description":"Saved stage Draft","userLoginName":"testa@abc.com.au","userDisplayName":"Test A","date":"2021-12-20T04:21:38.125Z"},"nextAction":""};
var updatedData = {"actionHistory":[{"type":"Submit","title":"Request submitted","description":"Saved stage Draft","userLoginName":"testa@abc.com.au","userDisplayName":"Test A","date":"2021-12-20T04:21:38.125Z"},{"type":"Submit","title":"Request submitted","description":"Saved stage Draft","userLoginName":"testa@abc.com.au","userDisplayName":"Test A","date":"2021-12-20T04:22:30.120Z"}],"dateSubmitted":"2021-12-20T04:20:35.287Z","containerEntries":[{"id":"1","details":"details"},{"id":"3","details":"details 3"}],"equipmentEntries":[],"deliveryDate":"","resources":[{"title":"Supervisor","id":"Supervisor","amount":0},{"title":"Fitter","id":"Fitter","amount":3},{"title":"Boilermaker","id":"Boilermaker","amount":0},{"title":"Rigger","id":"Rigger","amount":0},{"title":"Electrician","id":"Electrician","amount":0},{"title":"Instrumentation Tech.","id":"Instrumentation Tech.","amount":0},{"title":"CSC","id":"CSC","amount":0},{"title":"Specialised Resources","id":"Specialised Resources","amount":0}],"equipments":[{"title":"Crane","id":"Crane","amount":""},{"title":"EWP","id":"EWP","amount":"Require 4"},{"title":"Scaffold","id":"Scaffold","amount":""},{"title":"Special tools","id":"Special tools","amount":""}],"area":"Area 2","Requestor":"testa@abc.com.au","Submitter":"testa@abc.com.au","requestorOffice":"Melbourne Office","requestorManager":"testb@abc.com.au","requestorEmail":"testa@abc.com.au","requestorPhone":"","requestorPosition":"Consultant","requestorDepartment":"IT","requestType":"Add Late Work","canBeDoneOutsideShutdown":"Yes","wo":32423423,"revision":"REV 23333","description":"Description modified","work":"Mechanical","location":"Functional location","areaApproverId":3,"effectSafety":"Yes","effectReliability":"Yes","justification":"Testing","osApproval":"","lastAction":{"type":"Update","title":"Request updated","description":"Saved stage In Progress","userLoginName":"testa@abc.com.au","userDisplayName":"Test A","date":"2021-12-20T04:22:30.120Z"},"nextAction":""};

// Get the delta between two json objects in a format that can be used by the mergeJson function
var edits = JsonDiffMerge.jsonDiff(originalData, updatedData);

// Merge the edits into a copy of the original object
var merged = JsonDiffMerge.mergeJson(true, originalData, edits);

// Create your own JSON data to merge - e.g:
var merged = JsonDiffMerge.mergeJson(true, originalData, { 
		actionHistory: [
			// Update an entry in an array
			{
				date: "2021-12-20T04:21:38.125Z", // This property is the primary key
				userLoginName: "testb@abc.com.au", 
				userDisplayName: "Test B" 
			}],
			// Add an array entry
			containerEntries: [{
				id: JsonDiffMerge.newGuid(), // New primary key. It won't be found and so it will be inserted as a new entry
				details: "TEST entry", 
				__mergeAction: "AddOrUpdateForce"
			},
			// Delete an array entry where id is 1
			{
				id: "1", 
				__deleted: true
			}
		],
		// Update a propery
		description: "Test 123",
		// Add a new property
		description1: "Test abc"
	}
);
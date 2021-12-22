/*!
 * JsonDiffMerge Library v1
 * https://debugtopinpoint.wordpress.com/
 *
 * Ryan Steller
 *
 * Copyright Evolva Software
 * Released under the MIT license
 * https://opensource.org/licenses/MIT
 *
 * Date: 2021-12-22
 */
var JsonDiffMerge = window.JsonDiffMerge || (function(){
	/* 
		Get the delta between two json objects in a format that can be used by the mergeJson function.
		(*) Assumes that properties do not change type e.g. an array or primitive type will not change to an object
		(*) Deleting: Non-object values (primitive types) on a json object that no longer exist are ignored in the delta. Only objects that are removed will be given the '__deleted' flag if they have been removed.
		(*) Arrays: arrays of objects are compared based on a STRING-BASED primary key. The defaults are: uid, id, value, date. You should ensure all arrays have an id / uid string. NOTE: MUST BE A STRING.
			For custom primary keys you can designate these via arrayPrimaryKeyByArrayName e.g. { logs: "LogID", entries: "EntryID" };
	*/
    var jsonDiff = function(obj1, obj2, arrayPrimaryKeyByArrayName) {
        // Act on a COPY of the object rather than the passed object
        var obj1Clone = {};
        var obj2Clone = {};
		obj1Clone = JSON.parse(JSON.stringify(obj1));
		obj2Clone = JSON.parse(JSON.stringify(obj2));
        obj1 = obj1Clone;
        obj2 = obj2Clone;

        var delta = {};
        if (typeof (arrayPrimaryKeyByArrayName) === 'undefined') {
			arrayPrimaryKeyByArrayName = {};
        }
        var arrayDefaultPrimaryKey = 'uid';
        var arrayDefaultPrimaryKey1 = 'id';
        var arrayDefaultPrimaryKey2 = 'value';
        var arrayDefaultPrimaryKey3 = 'date';

        for (var property in obj2) {

            if (obj2[property] !== null && typeof (obj2[property]) === 'object' && typeof (obj2[property].getFullYear) === 'function' && typeof (obj2[property].getHours) === 'function' && typeof (obj2[property].toISOString) === 'function') {
                // Dates must be in ISO string format and not as an object for the json merge to succeed (otherwise it will try and walk properties on the date object and merge those)
                obj2[property] = obj2[property].toISOString();
                console.log("- Date object converted to ISO date string: " + property);
            }

            if (!Array.isArray(obj2[property]) && typeof (obj2[property]) === 'object' && obj2[property] !== null) {
                // This is an object. Navigate into it to compare child properties OR add it if it doesn't exist
                if (typeof (obj1[property]) === 'undefined') {
                    // Didn't exist
                    obj2[property].__mergeAction = 'AddOrUpdateForce';
                    delta[property] = obj2[property];
                }
                else {
                    // Exists. Navigate into it and compare its properties
                    var objectDelta = JsonDiffMerge.jsonDiff(obj1[property], obj2[property], arrayPrimaryKeyByArrayName);
                    if (Object.keys(objectDelta).length > 0) {
                        // Changes were found on this object?
                        delta[property] = objectDelta;
                    }
                }
            }
            else if (Array.isArray(obj2[property])) {
                if (typeof (obj1[property]) === 'undefined') {
                    // Array didn't exist
                    delta[property] = obj2[property];
                }
                else {
                    // This is an array. Compare each entry (by primary key)
                    for (var i = 0; i < obj2[property].length; i++) {
                        var arrayObj2 = obj2[property][i];
                        var arrayObj1 = null;

                        // Find the original object by primary key
                        var primaryKeyField = arrayPrimaryKeyByArrayName[property] ? arrayPrimaryKeyByArrayName[property] : arrayDefaultPrimaryKey;
                        var pk = arrayObj2[primaryKeyField];
                        if (typeof (pk) === 'undefined') {
                            pk = arrayObj2[arrayDefaultPrimaryKey];
                            primaryKeyField = arrayDefaultPrimaryKey;
                        }
                        if (typeof (pk) === 'undefined') {
                            pk = arrayObj2[arrayDefaultPrimaryKey1];
                            primaryKeyField = arrayDefaultPrimaryKey1;
                        }
                        if (typeof (pk) === 'undefined') {
                            pk = arrayObj2[arrayDefaultPrimaryKey2];
                            primaryKeyField = arrayDefaultPrimaryKey2;
                        }
                        if (typeof (pk) === 'undefined') {
                            pk = arrayObj2[arrayDefaultPrimaryKey3];
                            primaryKeyField = arrayDefaultPrimaryKey3;
                        }

                        if (typeof (pk) !== 'undefined') {
                            if (Array.isArray(obj1[property])) {
                                for (var x = 0; x < obj1[property].length; x++) {
                                    if (obj1[property][x][primaryKeyField] === pk) {
                                        arrayObj1 = obj1[property][x];
                                    }
                                }
                            }
                        }
                        if (arrayObj1 !== null) {
                            // Matching object. Compare its child properties.
                            var entryDelta = JsonDiffMerge.jsonDiff(arrayObj1, arrayObj2, arrayPrimaryKeyByArrayName);
                            if (Object.keys(entryDelta).length > 0) {
                                // There are diffs. Also capture the uid
                                entryDelta[primaryKeyField] = pk;
                                if (typeof (delta[property]) === 'undefined') {
                                    delta[property] = [];
                                }
                                entryDelta.__mergeAction = 'AddOrUpdateForce';
                                delta[property].push(entryDelta);
                            }
                        }
                        else {
                            // Array entry didn't exist
                            if (typeof (delta[property]) === 'undefined') {
                                delta[property] = [];
                            }
                            arrayObj2.__mergeAction = 'AddOrUpdateForce';
                            delta[property].push(arrayObj2);
                        }
                    }

                    // Check for deleted array entries
                    for (var i = 0; i < obj1[property].length; i++) { // jshint ignore:line
                        var arrayObj1 = obj1[property][i]; // jshint ignore:line
                        var arrayObj2 = null; // jshint ignore:line

                        // Find look for the object by primary key in the updated data
                        var primaryKeyField = arrayPrimaryKeyByArrayName[property] ? arrayPrimaryKeyByArrayName[property] : arrayDefaultPrimaryKey; // jshint ignore:line
                        var pk = arrayObj1[primaryKeyField]; // jshint ignore:line
                        if (typeof (pk) === 'undefined') {
                            pk = arrayObj1[arrayDefaultPrimaryKey];
                            primaryKeyField = arrayDefaultPrimaryKey;
                        }
                        if (typeof (pk) === 'undefined') {
                            pk = arrayObj1[arrayDefaultPrimaryKey1];
                            primaryKeyField = arrayDefaultPrimaryKey1;
                        }
                        if (typeof (pk) === 'undefined') {
                            pk = arrayObj1[arrayDefaultPrimaryKey2];
                            primaryKeyField = arrayDefaultPrimaryKey2;
                        }
                        if (typeof (pk) === 'undefined') {
                            pk = arrayObj1[arrayDefaultPrimaryKey3];
                            primaryKeyField = arrayDefaultPrimaryKey3;
                        }

                        if (typeof (pk) !== 'undefined') {
                            if (Array.isArray(obj2[property])) {
                                for (var x = 0; x < obj2[property].length; x++) { // jshint ignore:line
                                    if (obj2[property][x][primaryKeyField] === pk) {
                                        arrayObj2 = obj2[property][x];
                                    }
                                }
                            }
                            if (arrayObj2 === null) {
                                if (typeof (delta[property]) === 'undefined') {
                                    delta[property] = [];
                                }
                                var entryDelta = {}; // jshint ignore:line
                                entryDelta[primaryKeyField] = pk;
                                entryDelta['__deleted'] = true; // jshint ignore:line
                                delta[property].push(entryDelta);
                            }
                        }
                    }
                }
            }
            else { // The propery must be a JValue (not a JObject or JArray)
                if (property.indexOf('__') !== 0 && property.indexOf('$$') !== 0 && obj2[property] !== obj1[property]) {
                    // Value changed
                    delta[property] = obj2[property];
                }
            }
        }

        // Deleted object values
        for (var property in obj1) { // jshint ignore:line
            if (!Array.isArray(obj1[property]) && typeof (obj1[property]) === 'object') {
                if (typeof (obj2[property]) === 'undefined') {
                    // This object is deleted
                    delta[property] = { __deleted: true };
                }
            }
        }

        return delta;
    }

    // This represents an enumeration of merge actions for merging json data
    var MergeJsonAction = {
        UpdateOnly: 'UpdateOnly',
        AddOrUpdate: 'AddOrUpdate',
        AddOrUpdateForce: 'AddOrUpdateForce'
    };
    Object.freeze(MergeJsonAction);

	/*
		Merge edits into an original JSON object. Supports objects and arrays of objects (arrays of objects can be merged based on a primary key passed in. Defaults are: uid, id, value, date).
	*/
    var mergeJson = function(verboseLogging, node, nodeEdits, nodeAfterEdits, arrayMergeFieldByArrayName) {
        if (arrayMergeFieldByArrayName === null || typeof(arrayMergeFieldByArrayName) === 'undefined') {
            arrayMergeFieldByArrayName = {};
        }
        var updatesWereMade = { value: false };
        return mergeJsonInternal(verboseLogging, node, nodeEdits, nodeAfterEdits, '', arrayMergeFieldByArrayName, updatesWereMade);
    }

    /*
        Merge edits into an original JSON object. Supports objects and arrays of objects (arrays of objects can be merged based on a primary key passed in. Defaults are: uid, id, value, date).
        Special actions:
        (*) __deleted: an object with this property indicates the object should be deleted from the source object (e.g. to delete approver-1: [{_uid: 'approver-1', __deleted: '' }])
        (*) __mergeAction: Determines whether the object should be updated if found only OR ADDED if not found
		Parameter notes:
        (*) nodeEdits: specific edits to be pushed to the 'node' object
        (*) nodeAfterEdits: this is the full object that was modified (optional). If an array entry is not found by key then this is used to bring it back before merging the edits
     */
    var mergeJsonInternal = function(verboseLogging, node, nodeEdits, nodeAfterEdits, path, arrayMergeFieldByArrayName, updatesWereMade, nodeParent, nodePathFromParent) {
        if (typeof (path) === 'undefined' || path === null) {
            path = '';
        }
        if (path.length < 1) {
            // Root node? Act on a COPY of the object rather than the passed object. The new merged object is returned. The method should not mutate the passed objects.
            var nodeCopied = {};
			nodeCopied = JSON.parse(JSON.stringify(node));
            node = nodeCopied;
        }

        var arrayDefaultPrimaryKey = 'uid';
        var arrayDefaultPrimaryKey1 = 'id';
        var arrayDefaultPrimaryKey2 = 'value';
        var arrayDefaultPrimaryKey3 = 'date';

        var deleteNode = false;
        var updatesMadeInternal = { value: false }; // Keep track of whether any edits / updates were made to the source JSON object (object storing a boolean so it can be passed by reference and modified inside a method)

        for (var property in nodeEdits) {
            if (!Array.isArray(nodeEdits[property]) && typeof (nodeEdits[property]) === 'object') {
                // This is an object. Either delete it OR navigate into it to merge child properties OR add it if it doesn't exist
                var newPath = path;
                if (newPath.length > 0) {
                    newPath += ".";
                }
                newPath += property;

                if (typeof (nodeEdits[property]) === 'object' && typeof (nodeEdits[property].getFullYear) === 'function' && typeof (nodeEdits[property].getHours) === 'function' && typeof (nodeEdits[property].toISOString) === 'function') {
                    // Dates must be in ISO string format and not as an object for the json merge to succeed (otherwise it will try and walk properties on the date object and merge those)
                    nodeEdits[property] = nodeEdits[property].toISOString();
                    console.log("- Date object converted to ISO date string: " + path + "." + property);
                }

                var originalObjectAtKey = null;
                try { originalObjectAtKey = typeof (node[property]) !== 'undefined' ? node[property] : null; }
                catch (err) { }
                var nodeAfterEditsObjectAtKey = null;
                try { nodeAfterEditsObjectAtKey = typeof (nodeAfterEdits[property]) !== 'undefined' ? nodeAfterEdits[property] : null; }
                catch (err) { }

                if (originalObjectAtKey !== null) {
                    // The key exists on the original object. Iterate all properties on the child object
                    var updatesMade = { value: false };
                    mergeJsonInternal(verboseLogging, originalObjectAtKey, nodeEdits[property], nodeAfterEditsObjectAtKey, newPath, arrayMergeFieldByArrayName, updatesMade, node, property);
                    if (updatesMade.value === true) {
                        updatesMadeInternal.value = true;
                    }
                }
                else {
                    if (verboseLogging) {
                        console.log("- Key didn't exist on original object. Added: " + path + "." + property);
                    }
                    // This key doesn't exist on the original object. Add it.

                    // Only add this entry if it is not a deleted key or the mergeAction allows it
                    var mergeAction = MergeJsonAction.AddOrUpdate;
                    if (typeof (nodeEdits[property]['__mergeAction']) !== 'undefined') // jshint ignore:line
                    {
                        // Parse __mergeAction to the "enumeration" MergeJsonAction
                        try {
                            var found = false;
                            for (var key in MergeJsonAction) { if (nodeEdits[property]['__mergeAction'].toLowerCase() === key.toLowerCase()) { mergeAction = key; break; } } // jshint ignore:line
                        } catch (err) { }
                    }
                    //if (!(nodeEdits[property]).ContainsKey("__deleted") && (mergeAction == MergeJsonAction.AddOrUpdate || mergeAction == MergeJsonAction.AddOrUpdateForce))
                    if (typeof (nodeEdits[property]['__deleted']) === 'undefined' && (mergeAction === MergeJsonAction.AddOrUpdate || mergeAction === MergeJsonAction.AddOrUpdateForce)) // jshint ignore:line
                    {
                        // Add the missing object at key
                        node[property] = nodeEdits[property];
                        updatesMadeInternal.value = true;
                    }
                }
            }
            else if (Array.isArray(nodeEdits[property])) {
                // This is an array. Merge each entry with the source if a primary key was passed in
                var originalArrayAtKey = null;
                try { originalArrayAtKey = Array.isArray(node[property]) ? node[property] : null; }
                catch (err) { }

                var afterEditsArrayAtKey = null;
                try { afterEditsArrayAtKey = Array.isArray(nodeAfterEdits[property]) ? nodeAfterEdits[property] : null; }
                catch (err) { }

                var editsArrayAtKey = null;
                try { editsArrayAtKey = Array.isArray(nodeEdits[property]) ? nodeEdits[property] : null; }
                catch (err) { }

                if (originalArrayAtKey !== null) {

                    // Find look for the object by primary key in the updated data
                    var primaryKey = arrayMergeFieldByArrayName[property] ? arrayMergeFieldByArrayName[property] : arrayDefaultPrimaryKey; // jshint ignore:line

                    // Check which primary key exists on the target array objects by looking at the first entry
                    if (typeof (nodeEdits[property][nodeEdits[property].length - 1][primaryKey]) === 'undefined') {
                        primaryKey = arrayDefaultPrimaryKey1;
                    }
                    if (typeof (nodeEdits[property][nodeEdits[property].length - 1][primaryKey]) === 'undefined') {
                        primaryKey = arrayDefaultPrimaryKey2;
                    }
                    if (typeof (nodeEdits[property][nodeEdits[property].length - 1][primaryKey]) === 'undefined') {
                        primaryKey = arrayDefaultPrimaryKey3;
                    }

                    if (typeof (primaryKey) !== 'undefined') {
                        for (var n = 0; n < nodeEdits[property].length; n++) {
                            var objEdited = nodeEdits[property][n];
                            var pkUpdated = '';
                            try { pkUpdated = typeof (objEdited[primaryKey]) !== 'undefined' ? objEdited[primaryKey] : ''; }
                            catch (err) { }

                            // Find the full edited array entry by primary key
                            var objAfterEdits = null;
                            if (afterEditsArrayAtKey !== null) {
                                for (var n1 = 0; n1 < nodeEdits[property].length; n1++) {
                                    var objAfterEditsCheck = nodeEdits[property][n1];
                                    var pk = '';
                                    try { pk = objAfterEditsCheck[primaryKey] !== 'undefined' ? objAfterEditsCheck[primaryKey] : ''; }
                                    catch (err) { }
                                    if (pkUpdated === pk) {
                                        objAfterEdits = objAfterEditsCheck;
                                        break;
                                    }
                                }
                            }

                            var foundInOriginalArray = false;
                            if (pkUpdated.length > 0) {
                                // Find and update the corresponding object
                                var originalIndex = -1;
                                for (var i = 0; i < originalArrayAtKey.length; i++) {
                                    var objOriginal = originalArrayAtKey[i];

                                    originalIndex++;
                                    var pkOriginal = '';
                                    try { pkOriginal = typeof (objOriginal[primaryKey]) !== 'undefined' ? objOriginal[primaryKey] : ''; }
                                    catch (err) { }
                                    if (pkUpdated === pkOriginal) {
                                        // Found the corresponding entry by the primary key. Update its child properties.
                                        foundInOriginalArray = true;
                                        var newPath = path; // jshint ignore:line
                                        if (newPath.length > 0) {
                                            newPath += ".";
                                        }
                                        newPath += property + '[' + originalIndex + ']';

                                        if (verboseLogging) {
                                            console.log("- Merge array entry (match found by primary key - " + primaryKey + " = " + pkOriginal + "): " + path + "." + property);
                                        }
                                        var updatesMade = { value: false }; // jshint ignore:line
                                        mergeJsonInternal(verboseLogging, objOriginal, objEdited, objAfterEdits, newPath, arrayMergeFieldByArrayName, updatesMade, originalArrayAtKey, i);
                                        if (updatesMade.value === true) {
                                            updatesMadeInternal.value = true;
                                        }
                                    }
                                }
                            }
                            if (!foundInOriginalArray) {
                                // The original array didn't have an array entry by primary key. Explicitly add it.

                                var objToAdd = objAfterEdits;
                                if (objToAdd === null) {
                                    // The entry could not be found by key, but the full row was not provided. Should the "edits only" row get added into the array?
                                    if (typeof (objEdited['__mergeAction']) !== 'undefined') { // jshint ignore:line
                                        if (objEdited['__mergeAction'] === MergeJsonAction.AddOrUpdateForce) {// jshint ignore:line
                                            objToAdd = objEdited;
                                        }
                                    }
                                }

                                if (objToAdd !== null) {
                                    var objToAddPk = '';
                                    try { objToAddPk = typeof (objToAdd[primaryKey]) !== 'undefined' ? objToAdd[primaryKey] : ''; }
                                    catch (err) { }
                                    if (verboseLogging) {
                                        console.log("- The original array didn't have an array entry by primary key (" + objToAddPk + "). Explicitly add it: " + path + "." + property);
                                    }
                                    // Only add this entry if it is not a deleted key or the mergeAction allows it
                                    var mergeAction = MergeJsonAction.AddOrUpdate; // jshint ignore:line
                                    if (typeof (objToAdd['__mergeAction']) !== 'undefined') { // jshint ignore:line
                                        // Parse __mergeAction to the "enumeration" MergeJsonAction
                                        try {
                                            var found = false; // jshint ignore:line
                                            for (var key in MergeJsonAction) { if (objToAdd['__mergeAction'].toLowerCase() === key.toLowerCase()) { mergeAction = key; break; } } // jshint ignore:line
                                        } catch (err) { }
                                    }

                                    //if (!objToAdd.ContainsKey("__deleted") && (mergeAction === MergeJsonAction.AddOrUpdate || mergeAction === MergeJsonAction.AddOrUpdateForce)) {
                                    if (typeof (objToAdd['__deleted']) === 'undefined' && (mergeAction === MergeJsonAction.AddOrUpdate || mergeAction === MergeJsonAction.AddOrUpdateForce)) { // jshint ignore:line
                                        // Add the missing entry
                                        originalArrayAtKey.push(objToAdd);
                                        updatesMadeInternal.value = true;
                                    }
                                }
                            }
                            else {
                                updatesMadeInternal.value = true;
                            }
                        }
                    }
                    else {
                        // NO PRIMARY KEY for this array? Don't do anything for now
                    }
                }
                else {
                    // This array does not exist in the source object. Add the full edited array.
                    if (verboseLogging) {
                        console.log("- This key (an array) doesn't exist on the original object. Add it: " + path + "." + property);
                    }
                    node[property] = editsArrayAtKey;
                    updatesMadeInternal.value = true;
                }
            }
            else // The propery must be a JValue (not a JObject or JArray)
            {
                if (property === "__deleted") {
                    // Deleted flag -- remove this object
                    deleteNode = true;
                }
                else if (property.indexOf('__') !== 0 && property.indexOf('$$') !== 0) // Ignore double-underscore or angular internal keys ($$)
                {
                    var existingVal = '';
                    try { existingVal = typeof (node[property]) !== 'undefined' ? node[property] : ''; }
                    catch (err) { }
                    var newVal = '';
                    try { newVal = typeof (nodeEdits[property]) !== 'undefined' ? nodeEdits[property] : ''; }
                    catch (err) { }

                    // This is a regular attribute (neither object nor array). Replace the value with the updated value.
                    if (verboseLogging) {
                        console.log("- Replace attribute value: " + path + "." + property + " (prev: " + existingVal + ", new: " + newVal + ")");
                    }
                    if (existingVal !== newVal) {
                        node[property] = nodeEdits[property];
                        updatesMadeInternal.value = true;
                    }
                }
            }
        }
        if (deleteNode) {
            //node.Remove();
            if (Array.isArray(nodeParent)) {
                nodeParent.splice(nodePathFromParent, 1);
            }
            else {
                delete nodeParent[nodePathFromParent];
            }
            node = null;
            updatesMadeInternal.value = true;
        }

        if (typeof (updatesWereMade) === 'object') {
            updatesWereMade.value = updatesMadeInternal.value;
        }

        return node;
    }
	
	var newGuid = function() {
        var guid = '00000000-0000-0000-0000-000000000000';
        try {
            guid = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
                var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8); // jshint ignore:line
                return v.toString(16);
            });
        }
        catch (e) { }
        return guid;
    }
	
	// Public interface
	return {
		jsonDiff: jsonDiff,
		mergeJson: mergeJson,
		newGuid: newGuid
	};
})();	
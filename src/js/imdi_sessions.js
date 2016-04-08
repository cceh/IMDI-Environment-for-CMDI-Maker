/*
Copyright 2014 Sebastian Zimmer

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

    http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
*/


imdi_environment.workflow[3] = (function(resources, actor) {
	'use strict';

	var my = {};
	my.parent = imdi_environment;
	var l = my.parent.l;
	
	var session_form = undefined;  //yet
	
	my.identity = {
		id: "session",
		title: "Sessions",
		icon: "edit",
	};
	
	my.sessions = new ObjectList();
	my.resource_id_counter = 0;
	
	my.dom_element_prefix = "session_";

	my.reset = function(){ my.sessions.reset(); refresh();};
	
	my.init = function(view){
	
		my.sessions.reset();
		my.resource_id_counter = 0;
		
		session_form = my.parent.session_form();
		
		var actions = {
			deleteSession: my.userErase,
			newSession: my.newSession,
			addActor: my.addActor,
			addResource: my.addResource,
			removeActor: my.removeActor,
			removeResource: my.removeResource,
			setResourceIDCounterBiggerThan: function(number){
				if (my.resource_id_counter <= number){
					my.resource_id_counter = number + 1;
				}
			}
			
		};
		
		my.GUI.init(view, actions);
		
		my.GUI.createCopySessionOptions(session_form.fields_to_copy);
		
		refresh();

	};
	
	
	my.deleteSession = function(session_id){
	
		my.refreshSessionsArray();
		my.sessions.removeByID(session_id);
		refresh();
	
	}
	
	
	my.view = function(){
	
		my.GUI.view();
	
	};
	
	
	my.recall = function(data){
	
		//check if legacy data array
		if (Array.isArray(data) == true){
		
			my.sessions.reset();
		
			for (var s = 0; s < data.length; s++){
			
				my.sessions.add(data[s]);
			
			}
		
		}
		
		else {
		
			my.sessions.setState(data);
			
		}
		
		refresh();
	
	};
	
	
	my.getSaveData = function(){
	
		my.refreshSessionsArray();
		return my.sessions.getState();
	
	};
	
	
	my.refreshVisibleSessionsInArray = function(){

		forEach(
			my.GUI.pager.visible_items,
			my.refreshSessionInArray
		);
		
	};
	
	
	my.refreshSessionInArray = function(session){
	
		APP.forms.fillObjectWithFormData(session, my.dom_element_prefix + session.id + "_", session_form);		
	
	}
	
	
	my.functions = function(){
		return [
			{
				label: l("session", "new_session"),
				icon: "plus",
				id: "link_newSession",
				onclick: function() {my.newSession(); }
			},
			{
				label: l("session", "copy_session_1_metadata"),
				icon: "copy",
				id: "link_copy_sessions",
				wrapper_id: "copy_sessions_div",
				type: "function_wrap",
				sub_div: "copy_sessions_select",
				onclick: function() {
					
					if (my.sessions.length < 2){
		
						APP.log(l("session", "at_least_2_sessions_to_assign_metadata"), "error");
						return;
			
					}
					
					
					APP.confirm(l("main", "really_overwrite_data"), function (e) {
						if (e) {
							// user clicked "ok"
						}
				
						else {
							// user clicked "cancel" (as cancel is always the red button, the red button is chosen to be the executive button=
							my.assignSession1Metadata();
							
						}
					}, l("main", "no"), l("main", "yes_overwrite_data"));
				
				}
			},
			{
				label: l("session", "sort_by_name"),
				icon: "az",
				id: "session_link_sort_by_name",
				onclick: function() { my.sortAlphabetically(); }
			}
		];
	};
	

	my.newSession = function(){

		var session_object = APP.forms.createEmptyObjectFromTemplate(session_form);
		
		//new sessions are always expanded
		session_object.expanded = true;
		
		//push new session object into sessions array
		my.sessions.add(session_object);

		refresh();
		
		return session_object.id;
	};
	
	
	my.createNewSessionWithResources = function(name, expanded, resources){
	
		var session_object = APP.forms.createEmptyObjectFromTemplate(session_form);
		session_object.session.name = strings.removeCharactersFromString(name, my.parent.not_allowed_chars);
		session_object.expanded = expanded;

		my.sessions.add(session_object);
		
		forEach(resources, function(resource){
		
			my.addResource(session_object.id, resource);
			
		});
		
		APP.log(l("session", "new_session_has_been_created"));
		
		refresh();
		
		return session_object.id;
		
	};
	
	
	var refresh = function(){
		my.GUI.refresh(my.sessions.getAll());
	};
	
	
	my.getName = function(session_index){

		if (my.sessions.get(session_index).name === ""){
		
			return l("session", "unnamed_session");
			
		}
		
		else {
			return l("session", "session") + ": " + my.sessions.get(session_index).name;
		
		}
		
	};
	
	
	my.refreshActorLists = function(actors){
	
		my.GUI.refreshActorLists(my.sessions.getAll(), actors);
	
	};	
	
	
	my.sortAlphabetically = function(){
		
		my.refreshSessionsArray();
		my.sessions.sortBySubKey("session", "name");
		refresh();
		
	};
	
	
	my.refreshSessionsArray = function(){
	
		forEach(my.GUI.pager.visible_items, my.refreshSessionInArray);
	
	};


	my.userErase = function(session_id){

		APP.confirm(l("session", "really_erase_session"), function (e) {

			if (e) {
				// user clicked "ok"
				
			}
		
			else {
				// user clicked "cancel"
				
				my.refreshSessionsArray();
				my.sessions.removeByID(session_id);
				refresh();

				APP.log(l("session", "session_deleted"));
			}
		}, l("main", "no"), l("session", "yes_delete_session"));

	};


	my.getIndexFromResourceID = function (resource_id){
		var r;

		for (var s = 0; s < my.sessions.length; s++){
		
			for (r = 0; r < my.sessions.get(s).resources.resources.writtenResources.length; r++){
		
				if (my.sessions.get(s).resources.resources.writtenResources[r].id == resource_id){
					return r;
				}
			
			}
			
			for (r = 0; r < my.sessions.get(s).resources.resources.mediaFiles.length; r++){
		
				if (my.sessions.get(s).resources.resources.mediaFiles[r].id == resource_id){
					return r;
				}
			
			}
		
		
		
		}


	};
	

	my.addActor = function(session_id, actor_id){
	//add existing actor to session
	//new actors are only created in manage actors


		//if session doesn't already contain this actor
		if (my.sessions.getByID(session_id).actors.actors.indexOf(actor_id) == -1){
		
			if (actor.actors.IDexists(actor_id) == true){  //check if actor still exists before adding
		
				my.sessions.getByID(session_id).actors.actors.push(actor_id);
				refresh();
				
			}
			
			else {
			
				console.log("Tried to add actor to session although this actor is not in the actors database. This is odd.");
				return;
			
			}

		}
		
		else {
		
			APP.log(l("session", "this_actor_is_already_in_the_session"),"error");
		
		}
	};


	my.removeActor = function(session_id, actor_id){

		var position_in_array = my.sessions.getByID(session_id).actors.actors.indexOf(actor_id);
		
		console.log("Removing actor. Position in array: " + position_in_array);

		//remove actor_id in array
		my.sessions.getByID(session_id).actors.actors.splice(position_in_array,1);
		
		refresh();
		
	};


	my.addResource = function(session_id, resource_file_index, without_questions){
	// resource_file_index is the index of the available media file, that is to be added to the session
	// if resource_file_index is -1, a new empty field with no available media file is created
	//if without_questions == true, no alerts will be thrown (e.g. when resources are added at start up)
	
	
		my.refreshSessionsArray();
	
		var resource_type;

		if (resource_file_index >= resources.resources.length){
			return;
		}
		
		var resource_id = my.resource_id_counter;
		var res = resources.resources.get(resource_file_index);
		
		var file_type = resources.getValidityOfFile(res.name).type;

		if (file_type == "Media File"){
			
			resource_type = "mf";
		
			my.sessions.getByID(session_id).resources.resources.mediaFiles.push({
				name: res.name,
				size: res.size,
				id: resource_id,
				//resource_id: resource_id
			});

		}
		
		else if (file_type == "Written Resource"){
			
			resource_type = "wr";
		
			my.sessions.getByID(session_id).resources.resources.writtenResources.push({
				name: res.name,
				size: res.size,
				id: resource_id,
				//resource_id: resource_id
			});
			
		}
		
		else {
		
			if (!without_questions){
			
				APP.alert(l("session", "unknown_file_problem__before_filename") + "<br>" +
				res.name + 
				"<br>" + l("session", "unknown_file_problem__after_filename"));
			
			}
			
			resource_type = "wr";
			
			my.sessions.getByID(session_id).resources.resources.writtenResources.push({
				name: res.name,
				size: res.size,
				id: resource_id,
				//resource_id: resource_id
			});
			
		}
		
		var filename;
		var filesize;
		
		if (resource_file_index != -1){
		// if an existing media file is added, adopt its name and date to the input fields
			filename = res.name;
			filesize = res.size;

		}
		
		else {
			filename = "";
			filesize = "";
		}	
		
		
		//Rename the session if an EAF file is added for the first time and session has no name yet
		//condition is taken out since it is not desired. 16.11.2015
        /* 
        if ((strings.getFileTypeFromFilename(filename) == "eaf") && (my.sessions.getByID(session_id).session.name === "")){
		
			var name = strings.removeEndingFromFilename(res.name);
			
			my.sessions.getByID(session_id).session.name = name;

			APP.log(l("session", "session_name_taken_from_eaf"));
		
		}
	   */	
    
		
		//Check, if there is a date string in the form of YYYY-MM-DD in the filename of an eaf file. If so, adopt it for the session date
		//only, if session date is still YYYY
		if ((strings.getFileTypeFromFilename(filename) == "eaf") && (my.sessions.getByID(session_id).session.date.year == "YYYY")){
			
			var date = dates.parseDate(res.name);
			
			if (date !== null){
			
				my.sessions.getByID(session_id).session.date = date;
				
				APP.log(l("session", "session_date_extracted_from_eaf_file_name") +
				": " + date.year + "-" + date.month + "-" + date.day);
			
			}
		
		
		}
		
		refresh();

		my.resource_id_counter += 1;
		
		return resource_id;
		
	};


	my.removeResource = function(session_id, resource_id){
	
		
	
		var ids_of_sessions_media_files = getArrayWithIDs(my.sessions.getByID(session_id).resources.resources.mediaFiles);
		var ids_of_sessions_written_resources = getArrayWithIDs(my.sessions.getByID(session_id).resources.resources.writtenResources);

		if (ids_of_sessions_written_resources.indexOf(resource_id) != -1){

			my.sessions.getByID(session_id).resources.resources.writtenResources.splice(my.getIndexFromResourceID(resource_id),1);
		
		}
		
		if (ids_of_sessions_media_files.indexOf(resource_id) != -1){

			my.sessions.getByID(session_id).resources.resources.mediaFiles.splice(my.getIndexFromResourceID(resource_id),1);
		
		}
		
		refresh();

	};


	my.assignSession1Metadata = function(){
	
		var session_form_template = session_form;

		forEach(session_form_template.fields_to_copy, function(fields_object){
		
			if (g(APP.CONF.copy_checkbox_element_prefix + fields_object.name).checked){  //if checkbox is checked
			
				if (fields_object.name == "actors"){  //special case: actors!
				
					for (var s = 1; s < my.sessions.length; s++){   //for all sessions beginning with the 2nd
						my.removeAllActors(my.sessions.idOf(s));
			
						// copy actors from session 1 to session session
						forEach(my.sessions.get(0).actors.actors, function (actor){
							my.addActor(my.sessions.idOf(s), actor);
						});
					
					}
				
				}
			
				my.copyFieldsToAllSessions(fields_object.fields);
				
			}
		
		});
		
		refresh();

		APP.log(l("session", "session_1_metadata_assigned_to_all_sessions"));

	};


	my.copyFieldsToAllSessions = function(fields){
	//fields_to_copy is an array
	//it is indeed html conform to get textarea.value
		
		for (var s = 1; s < my.sessions.length; s++){   //important to not include the first session in this loop
		
			forEach(fields, function(field){
				if (field == "session_date"){
					my.sessions.get(s).session.date = cloneObject(my.sessions.get(0).session.date);
				}
				
				if (field == "session_location"){
					my.sessions.get(s).session.location = cloneObject(my.sessions.get(0).session.location);
				}
				
				if (field == "content"){
					my.sessions.get(s).content = cloneObject(my.sessions.get(0).content);
				}
				
				if (field == "project"){
					my.sessions.get(s).project = cloneObject(my.sessions.get(0).project);
				}
				
				if (field == "actors_description"){
					my.sessions.get(s).actors.description = my.sessions.get(0).actors.description;
				}
				
			});
		
		}
		
	};

	
	my.removeAllActors = function(session_id){
	//Remove all actors from respective session
		
		while (my.sessions.getByID(session_id).actors.actors.length > 0){
			my.removeActor(session_id, my.sessions.getByID(session_id).actors.actors[0]);
			//Remove always the first actor of this session because every actor is at some point the first	
		}
		
	};


	my.refreshResourcesOfAllSessions = function(){
	//Offer possibility to add every available media file to all session
	//refresh all sessions with available media files

		var visible_bundles = my.GUI.pager.visible_items;
	
		for (var s = 0; s < visible_bundles.length; s++){

			my.GUI.refreshResources(visible_bundles[s].id);
			
		}

	};
	
	
	my.areAllSessionsNamed = function(){
	
		return (!(my.sessions.isThereAnyItemWhereSubKeyIsValue("session", "name", "")));		
	
	}


	my.areAllSessionsProperlyNamed = function(){
	
		if (my.areAllSessionsNamed() == false){
		
			return false;
		
		}

		for (var i = 0; i < my.sessions.length; i++){
		
			for (var c = 0; c < my.parent.not_allowed_chars.length; c++){
		
				if (my.sessions.get(i).session.name.indexOf(my.parent.not_allowed_chars[c]) != -1){
			
					return false;
				
				}
		
			}
			
		}
		
		return true;
		
	};


	my.doesEverySessionHaveAProjectName = function(){

		return (!(my.sessions.isThereAnyItemWhereSubKeyIsValue("project", "name", "")));
		
	};
	
	
	my.updateActorNameInAllSessions = function(actor_id){
	
		my.GUI.updateActorNameInAllSessions(actor_id);
		
	};
	
	
	
	my.checkAllSessionNamesForInvalidChars = function(){
	
		forEach(my.sessions, my.checkSessionNameForInvalidChar);
		refresh();
		
	}
	
	
	my.checkSessionNameForInvalidChar = function(session){

		var session_name = get("session_" + session.id + "_session_name");

		session_name = strings.replaceAccentBearingLettersWithASCISubstitute(session_name);
		session_name = strings.removeAllCharactersFromStringExcept(session_name, "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789_");
		
		session.session.name = session_name;
		
		refresh();
	
	}


	return my;

})(imdi_environment.workflow[1],imdi_environment.workflow[2]);
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


imdi_environment.cmdi_generator = function(data){
	"use strict";
	
	var parent = imdi_environment;
	
	var already_warned_for_invalid_dates = false;
	var already_warned_for_invalid_birth_dates = false;

	var imdi_corpus_profile = "clarin.eu:cr1:p_1274880881885";
	var imdi_session_profile = "clarin.eu:cr1:p_1271859438204";
	
	var resources = parent.workflow[1];
	var actor = parent.workflow[2];

	var createIDREFS = function(){

		var rString1 = strings.randomString(8, '0123456789abcdefghijklmnopqrstuvwxyz');
		var rString2 = strings.randomString(4, '0123456789abcdefghijklmnopqrstuvwxyz');
		var rString3 = strings.randomString(4, '0123456789abcdefghijklmnopqrstuvwxyz');
		var rString4 = strings.randomString(4, '0123456789abcdefghijklmnopqrstuvwxyz');
		var rString5 = strings.randomString(12, '0123456789abcdefghijklmnopqrstuvwxyz');

		return "res_"+rString1+"_"+rString2+"_"+rString3+"_"+rString4+"_"+rString5;

	};
	
	
	var getActorAge = function (sessionDate, actor_birthDate){
	
		sessionDate = dates.getDateStringByDateObject(sessionDate);
		actor_birthDate = dates.getDateStringByDateObject(actor_birthDate);
		
		var age_calc_result = dates.calcAgeAtDate(sessionDate, actor_birthDate);
		
		if (typeof age_calc_result != "undefined" && age_calc_result !== 0){
		
			log("Actor's age successfully calculated");			
			return age_calc_result;
	
		}
		
		else {
		
			log("Actor's age could not be calculated. result = " + age_calc_result);
			return "Unspecified";
		
		}
		
	};


	var insertCMDIHeader = function(corpus_or_session){
		var profile_id;
		
		if ((corpus_or_session === 0) || (corpus_or_session == "corpus")){
			profile_id = imdi_corpus_profile;
		}

		else if ((corpus_or_session == 1) || (corpus_or_session == "session")){
			profile_id = imdi_session_profile;
		}
		
		else {
			return APP.error("An error has occurred! Cannot insert CMDI header without knowing if session or corpus is wanted.");
		}
		
		return xml.open("CMD",[["xmlns","http://www.clarin.eu/cmd/"],["xmlns:xsi","http://www.w3.org/2001/XMLSchema-instance"],
		["CMDVersion","1.1"],["xsi:schemaLocation","http://www.clarin.eu/cmd/ http://catalog.clarin.eu/ds/ComponentRegistry/rest/registry/profiles/"+profile_id+"/xsd "]]);

	};
	
	
	var create_cmdi_session = function(content_languages, session, actors){
		
		xml.header();
		insertCMDIHeader("session");
		insertHeader(get("metadata_creator"), dates.today() + dates.getTimezoneOffsetInHours(),imdi_session_profile);
		
		//in resources is nothing, as this is a session and no corpus. attached media files in a cmdi session are further down
		xml.open("Resources");
		xml.element("ResourceProxyList", "");
		xml.element("JournalFileProxyList", "");
		xml.element("ResourceRelationList", "");
		xml.close("Resources");
		xml.open("Components");
		
		/*
		all imdi session metadata is in between the components tag, declared with tag <Session>
		sadly, the structure of an imdi session is a little bit different in cmdi files
		that is why there needs to be an extra method for creating cmdi sessions
		luckily, it is here:
		*/
		insertCMDISessionData(content_languages, session, actors);
		
		xml.close("Components");
		xml.close("CMD");
		
	};


	var insertHeader = function(MdCreator, MdCreationDate, MdProfile){
		
		xml.open("Header");
		xml.element("MdCreator",MdCreator);
		xml.element("MdCreationDate",MdCreationDate);
		xml.element("MdProfile",MdProfile);
		xml.close("Header");
		
	};


	var insertCMDISessionData = function(content_languages, session, actors){
		
		xml.open("Session");
		xml.element("Name", session.session.name);
		xml.element("Title", session.session.title);
		
		xml.element("Date", dates.getDateStringByDateObject(session.session.date) || "Unspecified");
		
		// if a valid session date cannot be parsed from the form BUT there has been some input by the user
		// AND the user has not been warned before about that, warn him or her
		if (
			dates.isUserDefinedDateInvalid(session.session.date)
			&& (already_warned_for_invalid_dates == false)
		){
		
			APP.alert(
				parent.l("warning") +
				parent.l("output", "invalid_date_entered_in_session") + "<br>" +
				parent.l("output", "correct_or_ignore_warning")
			);
			
			already_warned_for_invalid_dates = true;
		}
		

		xml.open("MDGroup");
		xml.open("Location");
		xml.element("Continent", session.session.location.continent);
		xml.element("Country", session.session.location.country);
		xml.element("Region", session.session.location.region);
		xml.element("Address", session.session.location.address);
		xml.close("Location");
		
		
		xml.open("Project");
		xml.element("Name", session.project.name);
		xml.element("Title", session.project.title);
		xml.element("Id", session.project.id);
		
		xml.open("Contact");
		xml.element("Name", session.project.contact.name);
		xml.element("Address", session.project.contact.address);
		xml.element("Email", session.project.contact.email);
		xml.element("Organisation", session.project.contact.organisation);
		xml.close("Contact");
		xml.close("Project");
		xml.element("Keys", "");
		
		
		xml.open("Content");
		
		xml.element("Genre", session.content.genre);
		xml.element("SubGenre", session.content.subgenre);
		xml.element("Task", session.content.task);
		
		xml.element("Modalities", "");
		//no input yet
		
		xml.element("Subject", "");
		//no input yet
		
		xml.open("CommunicationContext");
		xml.element("Interactivity", session.content.communication_context.interactivity);
		xml.element("PlanningType", session.content.communication_context.planningtype);
		xml.element("Involvement", session.content.communication_context.involvement);	
		xml.element("SocialContext", session.content.communication_context.socialcontext);
		xml.element("EventStructure", session.content.communication_context.eventstructure);
		xml.element("Channel","Unknown");
		/* no input yet. channel must be one of
		<item ConceptLink="http://www.isocat.org/datcat/DC-2591">Unknown</item>
		<item ConceptLink="http://www.isocat.org/datcat/DC-2592">Unspecified</item>
		<item ConceptLink="http://www.isocat.org/datcat/DC-2593">Face to Face</item>
		<item ConceptLink="http://www.isocat.org/datcat/DC-2594">Experimental setting</item>
		<item ConceptLink="http://www.isocat.org/datcat/DC-2595">Broadcasting</item>
		<item ConceptLink="http://www.isocat.org/datcat/DC-2596">Telephone</item>
		<item ConceptLink="http://www.isocat.org/datcat/DC-2597">wizard-of-oz</item>
		<item ConceptLink="http://www.isocat.org/datcat/DC-2598">Human-machine dialogue</item>
		<item ConceptLink="http://www.isocat.org/datcat/DC-2599">Other</item>
		*/
		
		xml.close("CommunicationContext");
		
		xml.open("Content_Languages");
		insertContentLanguages(content_languages);
		xml.close("Content_Languages");
		
		
		
		xml.element("Keys", "");
	 
		xml.close("Content");
		
		xml.open("Actors");
		
		xml.open("descriptions");
			xml.element("Description", session.actors.description);
		xml.close("descriptions");
		
		forEach(session.actors.actors, function(actor_id){
		
			var ac = getObjectByID(actors, actor_id);
			
			if (ac.age === "" && g("radio_age_calc").on){
				ac.age = getActorAge(session.session.date, ac.birth_date);
			}
			
			//if radio age calc is off and ac.age is "", then replace it
			if (ac.age === ""){
				ac.age = "Unspecified";
			}
		
			insertActor(ac);
			
		});
		
		xml.close("Actors");  
		xml.close("MDGroup");
		
		xml.open("Resources");
		
		var id;
		
		for (var r = 0; r < session.resources.resources.mediaFiles.length; r++){  
	
			insertMediafile(session.resources.resources.mediaFiles[r]);
			
		}
		
		for (r = 0; r < session.resources.resources.writtenResources.length; r++){  

			insertWrittenResource(session.resources.resources.writtenResources[r]);
			
		}
		
		//more resource stuff
		xml.close("Resources");
		
		xml.close("Session");

	};

	
	var insertContentLanguages = function (languages) {

		for (var l = 0; l < languages.length; l++){  //for all content languages // no session separate languages yet
	
			xml.open("Content_Language");
			xml.element("Id", APP.CONF.LanguageCodePrefix + languages[l][0]);
			xml.element("Name", languages[l][3]);
			xml.close("Content_Language");
	
		}
		
	};
	

	var insertWrittenResource = function(file){
	
		xml.open("WrittenResource");

		xml.element("ResourceLink", file.name);
		xml.element("MediaResourceLink","");

		xml.element("Date","Unspecified");
		//no input yet, but should come soon
		
		xml.element("Type", resources.getFileType(file.name).type);
		xml.element("SubType", resources.getFileType(file.name).type);
		xml.element("Format", resources.getFileType(file.name).mimetype);
		xml.element("Size", file.size);
		
		xml.open("Validation");
		xml.element("Type","");
		xml.element("Methodology","");
		xml.element("Level","Unspecified");
		xml.element("Description","");
		xml.close("Validation");

		xml.element("Derivation","");

		xml.element("CharacterEncoding","");
		xml.element("ContentEncoding","");
		xml.element("LanguageId","");
		xml.element("Anonymized","Unspecified");

		xml.open("Access");

		xml.element("Availability", "");
		xml.element("Date", "");
		xml.element("Owner", "");
		xml.element("Publisher", "");
		
		xml.open("Contact");
		xml.element("Name", "");
		xml.element("Address", "");
		xml.element("Email", "");
		xml.element("Organisation", "");
		xml.close("Contact");

		xml.element("Description","");

		xml.close("Access");

		xml.element("Description","");
		xml.element("Keys","");
		xml.close("WrittenResource");

		
		
	};


	var insertMediafile = function(file){

		
		xml.open("MediaFile");
		xml.element("ResourceLink", file.name);
		xml.element("Type", resources.getFileType(file.name).type);
		xml.element("Format", resources.getFileType(file.name).mimetype);
		xml.element("Size", file.size);
		
		xml.element("Quality","Unspecified");
		// no input yet
		
		xml.tag("RecordingConditions", "");
		
		xml.open("TimePosition");
		
		xml.element("Start","Unspecified");
		xml.element("End","Unspecified");
		//no input yet
		
		xml.close("TimePosition");
		

		xml.open("Access");

		xml.element("Availability", "");
		xml.element("Date", "");
		xml.element("Owner", "");
		xml.element("Publisher", "");
		
		xml.open("Contact");
		xml.element("Name", "");
		xml.element("Address", "");
		xml.element("Email", "");
		xml.element("Organisation", "");
		xml.close("Contact");

		xml.close("Access");

		xml.element("Keys","");
		
		xml.close("MediaFile");
		
	};


	var insertActor = function(ac){

		xml.open("Actor");
		xml.element("Role",ac.role);
		xml.element("Name",ac.name);
		xml.element("FullName",ac.full_name);
		xml.element("Code",ac.code);
		xml.element("FamilySocialRole",ac.family_social_role);
		xml.element("EthnicGroup",ac.ethnic_group);   
		
		xml.element("Age", ac.age);
		xml.element("BirthDate", dates.getDateStringByDateObject(ac.birth_date) || "Unspecified");
		

		if (
			dates.isUserDefinedDateInvalid(ac.birth_date)
			&& (already_warned_for_invalid_birth_dates == false)
		){

			APP.alert(
				parent.l("warning") +
				parent.l("output", "invalid_birth_date_entered") + "<br>" +
				parent.l("output", "correct_or_ignore_warning")
			);
			
			already_warned_for_invalid_birth_dates = true;
		}
		
		
		xml.element("Sex", ac.sex);
		xml.element("Education",(ac.education !== "") ? ac.education : "Unspecified" );
		xml.element("Anonymized",(ac.anonymized) ? "true" : "false"); 
		
		xml.open("Contact");
		xml.element("Name",ac.contact.name);   
		xml.element("Address",ac.contact.address);   
		xml.element("Email",ac.contact.email);   
		xml.element("Organisation",ac.contact.organisation);   
		xml.close("Contact");

		xml.element("Keys", "");
		
		xml.open("descriptions");
		xml.element("Description",ac.description);
		xml.close("descriptions");	
		
		xml.open("Actor_Languages");
		//xml.element("Description","");
		
		for (var l=0; l<ac.languages.length; l++){
		
			xml.open("Actor_Language");
			xml.element("Id",APP.CONF.LanguageCodePrefix+ac.languages[l].LanguageObject[0]);
			xml.element("Name",ac.languages[l].LanguageObject[3]);
			
			xml.element("MotherTongue",(ac.languages[l].MotherTongue) ? "true" : "false");
			xml.element("PrimaryLanguage",(ac.languages[l].PrimaryLanguage) ? "true" : "false");		

			xml.close("Actor_Language");
		
		}

		xml.close("Actor_Languages");
		
		xml.close("Actor");		
		
	};


	var createCorpus = function(corpus, sessions){
		
		var IDREFS = [];
		
		xml.header();

		insertCMDIHeader("corpus");

		insertHeader(get("metadata_creator"), dates.today() + dates.getTimezoneOffsetInHours(), imdi_corpus_profile);

		xml.open("Resources");

		//Resource Proxy List contains other CMDI files, e.g. CMDI sessions, if this is a corpus
		if (sessions.length > 0){
			xml.open("ResourceProxyList");
			
			for (var i = 0; i < sessions.length; i++){  
			
				IDREFS.push(createIDREFS());
				
				xml.open("ResourceProxy", [["id", IDREFS[i]]]);
				xml.element("ResourceType", "Metadata");
				xml.element("ResourceRef", sessions[i].session.name + ".cmdi");
				xml.close("ResourceProxy");
			}
			
			xml.close("ResourceProxyList");
		}
		
		else {
			xml.element("ResourceProxyList", "");
		}
		
		xml.element("JournalFileProxyList", "");
		xml.element("ResourceRelationList", "");
		xml.close("Resources");
		xml.open("Components");

		var IDREFS_string = IDREFS.join(" ");
		
		xml.open("imdi-corpus",[["ref",IDREFS_string]]);
		xml.open("Corpus");
		
		xml.element("Name", get("corpus_name"));
		xml.element("Title", get("corpus_title"));
		//seems like there is no field for description here!
		
		xml.close("Corpus");
		xml.close("imdi-corpus");
		xml.close("Components");
		xml.close("CMD");

	};
	
	var my = {};
	my.sessions = [];
	
	var xml = new XMLString();
	createCorpus(data.corpus, data.sessions);
	
	my.corpus = xml.getString();
    
	for (var s = 0; s < data.sessions.length; s++){
	
		xml = new XMLString();
		create_cmdi_session(data.content_languages, data.sessions[s], data.actors);
		my.sessions.push(xml.getString());
		
	}

	return my;

};
/*

	JXON [Javascript XML Object Notation] library

	MDN JXON https://developer.mozilla.org/en-US/docs/JXON

	This is unofficial library.

	Distribute & Documents  https://github.com/mu-tan8/JXON

	MIT Lisence Copyright (c) 2015 mu-tan8(theta)

*/


/*
	How To Use

	//Object to JXONObject
		var object = {'form':{'@method':'post','@action':'.','input':[{'@name':'uname'},{'@name':'upw','@type':'password'},{'@type':'submit','@value':'login'}]}};
		var jxon = new JXON(object);
	//JXONTreeObject add JXONTreeObject
		jxon.form.appendBranch({'#text':'test'});
	//JXONObject validation
		jxon.validate();
	//XML or HTML to JXONObject
		var jxon = new JXON();
		jxon.build(doc);
	//JXONObject to HTML on browser
		var HTMLNode = jxon.toDOM();
		//document.body.appendChild(HTMLNode);
	//get HTML Strings value option (near eq. jxon.toDOM().innerHTML;)
		var HTMLStrings = jxon.toDOMString();
	//JXONObject to XML
		var XMLNode = jxon.toDOM(XMLObject);
		//XMLObject.getElementsByTagName('node')[0].appendChild(XMLNode);

	//JSON not support version only(alter. JSON.stringify(jxon); )
		var JSON = jxon.toJSON();
*/

function JXONTree(object){
	var mySelfObject = (this instanceof JXONTree) ? this : new JXONTree() ;
	JXON.call(mySelfObject , object);
	mySelfObject.build = function (){};
	mySelfObject.validate = function (){};
	delete mySelfObject['$NAMESPACES'];
	return mySelfObject;
}

function JXON(object){

	var mySelfObject = (this instanceof JXON) ? this : new JXON() ;

	var NameSpaces = {};
	NameSpaces['@xmlns'] = null;

	if ((function(obj,myObject){
		if (obj instanceof Array){
			callBackf("Object construction error\n"+obj.toString());
			return 1;
		}else if(obj instanceof Object){
			for (var p in obj){
				if (/^(:|\d|.+[@#!?$%\"\'\=\<\>\/\\\s])/.test(p)){
					callBackf("invalid property name\n"+p.toString());
				}else if (/^\?xml$/i.test(p)){
					callBackf("invalid property name\n"+p.toString());
				}else if (/^\$([\w]+)$/.test(p)){
				}else if (/^@xmlns:?([\w\-]*)$/.test(p)){
					if (!/^https?:\/\/[\w]+\.[\w\/\.]+/.test(obj[p])){
						callBackf("invalid property value\n"+p+":"+obj[p].toString());
						myObject[p] = void(obj[p]);
					}else{
						myObject[p] = parseText(escapeJS(obj[p]));
						NameSpaces[/^@xmlns:?([\w\-]*)$/.exec(p)[0]] = myObject[p];
					}
				}else if (/^(@[\w\-]+:?[\w\-]*|\?([\w\-]+)|#text|#comment)$/i.test(p)){
					if (obj[p] instanceof Array || obj[p] instanceof Object){
						callBackf("Object construction error\n"+p+":"+obj[p].toString());
						myObject[p] = void(obj[p]);
					}else {
						myObject[p] = parseText(escapeJS(obj[p]));
					}
				}else{
					if (obj[p] instanceof Array){
						myObject[p] = [];
						for (var i = 0;i < obj[p].length;i++){
							myObject[p][i] = new JXONTree(obj[p][i]);
							arguments.callee(obj[p][i],myObject[p][i]);
						}
						i = void(null);
					}else if(obj[p] instanceof Object){
						myObject[p] = new JXONTree(obj[p]);
						arguments.callee(obj[p],myObject[p]);
					}else{
						myObject[p] = parseText(escapeJS(obj[p]));
					}
				}
				p = void(null);
			}
		}
	})(object,mySelfObject)){
		return new JXON();
	}else{
		JXON.prototype['$NAMESPACES'] = NameSpaces;
		NameSpaces = void(null);
		return mySelfObject;
	}
}


	function warnlog(mes){
		try {
			console.warn(mes);
		}catch (e){

		}
	}
	function callBackf(mes){
		try {
			console.error(mes);
		}catch (e){
			try {
				Debug.write(mes);
			}catch (e){
				var err = new Error(mes);
				err.name = 'JXONError';
				throw err;
			}
		}
	}
	function escapeJS(str){
		return String(str).replace(/\\/gm,"\\\\").replace(/\"|\&quot\;/gm,"\\\"").replace(/\n|\&#010\;/gm,"\\n");
	}
	function unescapeJS(str){
		return String(str).replace(/\\n/g,"\n").replace(/\\"/g,"\"").replace(/\\/g,"\\");
	}
	function hasMarkup(str){
		return (/[\<\>]|\&lt\;|\&gt\;/m.test(str) && !/\]\](\>|\&gt\;)/m.test(str));
	}
	function parseText(value){
		if (/^\s*$|^\s*null\s*$/i.test(value)){
			return null;
		}else if(/^(true|false)$/i.test(value)){
			return (String(value).toLowerCase() === "true");
		}else if (isFinite(value)){
			return parseFloat(value);
		}else{
			return value;
		}
	}
	var getNamedChildren = function (oNode,name){
		var oNodes = oNode.childNodes;
		var n = 0 , Nodes = [];
		for (var i = 0;i < oNodes.length;i++){
			if (oNodes[i].nodeName == name){
				Nodes[n] = oNodes[i];
				n++;
			}
		}
		oNodes = i = n = void(null);
		return Nodes;
	}



JXON.prototype = {



	toString : function (){
		if (typeof(this)=='object'){
			if (this instanceof Array){
				return '[object Array]';
			}else if(this instanceof JXON){
				return '[object JXONObject]';
			}else if(this == null){
				return String(null);
			}else{
				return String(this);
			}
		}else{
			return String(parseText(this));
		}
	},



	empty : function(){
		for (var p in this){
			if (this[p] == null || this[p].constructor != Function){
				delete this[p];
			}
			p = void(null);
		}
	},



	appendBranch : function(object){
		JXONTree.call(this , object);
		return this;
	},



	validate : function(){
		var NameSpaces = {};
		NameSpaces['@xmlns'] = null;
		if ((function(obj){
			if (obj instanceof Array){
				callBackf("Object construction error\n"+obj.toString());
				return 1;
			}else if(obj instanceof JXONTree){
				for (var p in obj){
					if (/^(:|\d|.+[@#!?$%\"\'\=\<\>\/\\\s])/.test(p)){
						callBackf("invalid property name\n"+p.toString());
					}else if(/^\?xml$/i.test(p)){
						callBackf("invalid property name\n"+p.toString());
					}else if(/^\$([\w]+)$/.test(p)){
						if (/^\$([\w]+)$/.exec(p)[0] == '$NAMESPACES'){
							for (var s in obj[p]){
								NameSpaces[s] = obj[p][s];
								s = void(null);
							}
						}
					}else if(/^@xmlns:?[\w\-]*$/.test(p)){
						if (!/^https?:\/\/[\w]+\.[\w\/\.]+/.test(obj[p])){
							callBackf("invalid property value\n"+p+":"+obj[p].toString());
							obj[p] = void(obj[p]);
						}
					}else if(/^(@[\w\-]+:?[\w\-]+|\?([\w\-]+)|#text|#comment)$/i.test(p)){
						if (obj[p] instanceof Array || ( obj[p] instanceof JXONTree || obj[p] instanceof Object ) ){
							callBackf("Object construction error\n"+p+":"+obj[p].toString());
							obj[p] = void(obj[p]);
						}
					}else{
						if (obj[p] instanceof Array){
							obj[p] = [];
							for (var i = 0;i < obj[p].length;i++){
								arguments.callee(obj[p][i]);
							}
							i = void(null); 
						}else if(obj[p] instanceof JXONTree || obj[p] instanceof Object){
							arguments.callee(obj[p]);
						}
					}
					p = void(null);
				}
			}else if(obj instanceof Object){
				for (var p in obj){
					warnlog("not initialize object. alternate initialized.\n"+p+":"+obj[p]);
					if (/^(:|\d|.+[@#!?$%\"\'\=\<\>\/\\\s])/.test(p)){
						callBackf("invalid property name\n"+p.toString());
					}else if(/^\?xml$/i.test(p)){
						callBackf("invalid property name\n"+p.toString());
					}else if(/^\$([\w]+)$/.test(p)){
						if (/^\$([\w]+)$/.exec(p)[0] == '$NAMESPACES'){
							for (var s in obj[p]){
								NameSpaces[s] = obj[p][s];
								s = void(null);
							}
						}
					}else if(/^@xmlns:?([\w\-]*)$/.test(p)){
						if (!/^https?:\/\/[\w]+\.[\w\/\.]+/.test(obj[p])){
							callBackf("invalid property value\n"+p+":"+obj[p].toString());
							obj[p] = void(obj[p]);
						}else{
							obj[p] = parseText(escapeJS(obj[p]));
							NameSpaces[/^@xmlns:?([\w\-]*)$/.exec(p)[0]] = obj[p];
						}
					}else if (/^(@[\w\-]+:?[\w\-]*|\?([\w\-]+)|#text|#comment)$/i.test(p)){
						if (obj[p] instanceof Array || obj[p] instanceof Object){
							callBackf("Object construction error\n"+p+":"+obj[p].toString());
							obj[p] = void(obj[p]);
						}else {
							obj[p] = parseText(escapeJS(obj[p]));
						}
					}else{
						if (obj[p] instanceof Array){
							obj[p] = [];
							for (var i = 0;i < obj[p].length;i++){
								obj[p][i] = new JXONTree(obj[p][i]);
								arguments.callee(obj[p][i]);
							}
							i = void(null); 
						}else if(obj[p] instanceof Object){
							obj[p] = new JXONTree(obj[p]);
							arguments.callee(obj[p]);
						}else if(obj[p] instanceof JXONTree){
							arguments.callee(obj[p]);
						}else{
							obj[p] = parseText(escapeJS(obj[p]));
						}
					}
					p = void(null);
				}
			}
		})(this)){
			return false;
		}else{
			this.constructor.prototype['$NAMESPACES'] = NameSpaces;
			NameSpaces = void(null);
			return true;
		};
	},



	build : function(oDoc){
		if (!oDoc){return false};
		if (!'childNodes' in oDoc){return false};
		this.empty();
		var NameSpaces = {};
		NameSpaces['@xmlns'] = null;
		(function(oNode , object){
			var oNodes = oNode.childNodes;
			for (var i = 0;i < oNodes.length;i++){
				var name = oNodes[i].nodeName;
				var value = oNodes[i].nodeValue;
				switch (oNodes[i].nodeType){
					case 1 :	//ELEMENT_NODE
						var oNodeLists = getNamedChildren(oNode,name);
						if (oNodeLists.length > 1){
							object[name] = [];
							for (var n = 0;n < oNodeLists.length;n++){
								object[name][n] = new JXONTree();
								var pref = (oNodeLists[n].prefix) ? '@xmlns:'+oNodeLists[n].prefix : '@xmlns' ;
								if (oNodeLists[n].namespaceURI && !NameSpaces[pref]){
									object[name][n][pref] = oNodeLists[n].namespaceURI;
									NameSpaces[pref] = object[name][n][pref];
								}
								var oAttr = oNodeLists[n].attributes;	//ATTRIBUTE_NODE
								for (var a = 0;a < oAttr.length;a++){
									object[name][n]['@'+oAttr[a].nodeName] = parseText(oAttr[a].nodeValue);
									var pref = (oAttr[a].prefix) ? '@xmlns:'+oAttr[a].prefix : '@xmlns';
									if (oAttr[a].namespaceURI && !NameSpaces[pref]){
										object[name][n][pref] = oAttr[a].namespaceURI;
										NameSpaces[pref] = object[name][n][pref];
									}
									pref = void(null);
								}
								oAttr = pref = a = void(null);
								arguments.callee(oNodeLists[n] , object[name][n]);
								oNode.removeChild(oNodeLists[n]);
							}
							n = void(null);
						}else{
							object[name] = new JXONTree();
							var pref = (oNodes[i].prefix) ? '@xmlns:'+oNodes[i].prefix : '@xmlns' ;
							if (oNodes[i].namespaceURI && !NameSpaces[pref]){
								object[name][pref] = oNodes[i].namespaceURI;
								NameSpaces[pref] = object[name][pref];
							}
							var oAttr = oNodes[i].attributes;	//ATTRIBUTE_NODE
							for (var a = 0;a < oAttr.length;a++){
								object[name]['@'+oAttr[a].nodeName] = parseText(oAttr[a].nodeValue);
								var pref = (oAttr[a].prefix) ? '@xmlns:'+oAttr[a].prefix : '@xmlns';
								if (oAttr[a].namespaceURI && !NameSpaces[pref]){
									object[name][pref] = oAttr[a].namespaceURI;
									NameSpaces[pref] = object[name][pref];
								}
								pref = void(null);
							}
							oAttr = a = void(null);
							arguments.callee(oNodes[i] , object[name]);
						}
						oNodeLists = void(null);
						break;
					case 3 :	//TEXT_NODE
					case 4 :	//CDATA_SECTION_NODE
						object['#text'] = parseText(value);
						break;
					case 7 :	//PROCESSING_INSTRUCTION_NODE
						if (name != 'xml'){
							object['?'+name] = value;
						};
						break;
					case 8 :	//COMMENT_NODE
						object['#comment'] = value;
						break;
					default :
						break;
				}
				name = value = void(null);
			}
			oNodes = i = void(null);
		})(oDoc,this);
		this.constructor.prototype['$NAMESPACES'] = NameSpaces;
		NameSpaces = void(null);
		return this;
	},



	toDOM : function(oDocument){
		var oDocument = oDocument || document;
		if (!'createElement' in oDocument){return false};
		var oDiv = oDocument.createElement('div');
		if (!'appendChild' in oDiv){return false};
		var oRoot = ('createDocumentFragment' in oDocument) ? oDocument.createDocumentFragment() : oDiv ;
		var NameSpaces = this.constructor.prototype['$NAMESPACES'];
		(function(object,oNode){
			for (var p in object){
				if (object[p] == null || object[p].constructor != Function){
					if (/^(@xmlns:?[\w\-]*)|\?xml|\$([\w]+)?$/.test(p)){
					}else if (/^\?([\w\-]+)$/.test(p)){
						if ('createProcessingInstruction' in oDocument){
							oNode.appendChild(oDocument.createProcessingInstruction(/^\?([\w\-]+)$/.exec(p)[1] , unescapeJS(object[p]).replace(/\?\>/gm,"&#03f;&gt;")));
						}
					}else if (/^@([\w\-]+:?[\w\-]*)$/.test(p)){
						var key = /^@([\w\-]+):?([\w\-]*)$/.exec(p);
						var prefix = (key[2]) ? '@xmlns:'+key[1] : '@xmlns';
						var value = unescapeJS(object[p]);
						if ('setAttributeNS' in oNode && NameSpaces[prefix]){
							oNode.setAttributeNS(NameSpaces[prefix] , ((key[2]) ? ''+key[1]+':'+key[2] : key[1]) , value);
						}else{
							oNode.setAttribute((key[2]) ? key[2] : key[1] , value);
						}
						key = prefix = value = void(null);
					}else if (/^#text$/i.test(p)){
						if (object[p]){
							oNode.appendChild((hasMarkup(object[p]) && ('createCDATASection' in oDocument && oDiv.tagName == 'div')) ? oDocument.createCDATASection(unescapeJS(object[p])) : oDocument.createTextNode(unescapeJS(object[p])));
						}
					}else if(/^#comment$/i.test(p)){
						if ('createComment' in oDocument){
							oNode.appendChild(oDocument.createComment(unescapeJS(object[p]).replace(/\-\-/gm,"\\-\\-")));
						}
					}else{
						var key = /^([\w\-]+):?([\w\-]*)$/.exec(p);
						var prefix = (key[2]) ? '@xmlns:'+key[1] : '@xmlns';
						if (object[p] instanceof Array){
							for (var i = 0;i < object[p].length;i++){
								arguments.callee(object[p][i] , oNode.appendChild(('createElementNS' in oDocument && NameSpaces[prefix]) ? oDocument.createElementNS(NameSpaces[prefix] , p) : oDocument.createElement((key[2]) ? key[2] : key[1])));
							}
							i = void(null);
						}else{
							var oElement = ('createElementNS' in oDocument && NameSpaces[prefix]) ? oDocument.createElementNS(NameSpaces[prefix] , p) : oDocument.createElement((key[2]) ? key[2] : key[1] ) ;
							if (object[p] instanceof JXONTree){
								arguments.callee(object[p] , oNode.appendChild(oElement));
							}else{
								if(parseText(object[p]) != null){
									oNode.appendChild(oElement).appendChild((hasMarkup(object[p]) &&('createCDATASection' in oDocument && oDiv.tagName == 'div')) ? oDocument.createCDATASection(unescapeJS(object[p])) : oDocument.createTextNode(unescapeJS(object[p])));
								}else{
									oNode.appendChild(oElement);
								}
							}
							oElement = void(null);
						}
						key = prefix = void(null);
					}
				}
				p = void(null);
			}
		})(this,oRoot);
		NameSpaces = oDocument = void(null);
		return (oRoot.nodeType == 11) ? oRoot : oRoot.childNodes ;
	},



	toDOMString : function (oDocument){
		var oDocument = oDocument || document;
		if (!'createElement' in oDocument){return false};
		var oRoot = oDocument.createElement('div');
		if (!'appendChild' in oRoot){return false};
		var oNodes = this.toDOM(oDocument);
		if (oNodes.length){
			for (var i = 0;i < oNodes.length;i++){
				oRoot.appendChild(oNodes[i]);
			}
			i = void(null);
		}else{
			oRoot.appendChild(oNodes);
		}
		oNodes = oDocument = void(null);
		return oRoot.innerHTML;
	}

}


if (!this.JSON){

	JXON.prototype.toJSON = function (){
		return (function (object){
			var str = '';
			if (object instanceof Array){
				str += '[';
				for (var i = 0;i < object.length;i++){
					str += ''+arguments.callee(object[i])+((i < object.length - 1) ? ',' : '');
				}
				str += ']';
			}else if(object instanceof JXON || object instanceof Object){
				str += '{';
				for (var p in object){
					if (object[p] == null || object[p].constructor != Function){
						str += '"'+p+'":'+arguments.callee(object[p])+',';
					}
				}
				str = str.substring(0, str.length - 1);
				str += '}';
			}else{
				switch (typeof(parseText(object))){
					case 'string':
						str = '"'+escapeJS(object)+'"';
						break;
					case 'number':
					case 'boolean':
						str = parseText(object);
						break;
					default:
						str = (parseText(object)) ? object : null;
					break;
				}
			}
			return str;
		})(this);
	}
}


JXONTree.prototype = JXON.prototype;
JXONTree.prototype.constructor = JXONTree;



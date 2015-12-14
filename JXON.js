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

	//JSON not support version only
		var JSON = jxon.toJSON();
*/

function JXONTree(object){
	var mySelfObject = (this instanceof JXONTree) ? this : new JXONTree(object) ;
	JXON.call(mySelfObject , object);
	mySelfObject.build = function (){};
	return mySelfObject;
}

function JXON(object){

	var mySelfObject = (this instanceof JXON) ? this : new JXON(object) ;

	var mes = (function(obj,myObject){
		if (obj instanceof Array){
			callBackf(''+obj.toString());
			return 'Object construction error';
		}else if(obj instanceof Object){
			for (var p in obj){
				if (/^(:|\d|.+[@#!?$%\"\'\=\<\>\/\\\s])/.test(p)){
					callBackf(''+p.toString());
					return 'invalid property name';
				}else if (/^@xmlns:?[\w\-]*$/.test(p)){
					if (!/^https?:\/\/[\w]+\.[\w\/\.]+/.test(obj[p])){
						callBackf(''+p+':'+obj[p].toString());
						return 'invalid property value';
					}else{
						myObject[p] = parseText(escapeJS(obj[p]));
					}
				}else if (/^(@[\w\-]+:?[\w\-]+|\?([\w\-]+)|#text|#comment)$/i.test(p)){
					if (obj[p] instanceof Array || obj[p] instanceof Object){
						callBackf(''+p+':'+obj[p].toString());
						return 'Object construction error';
					}else {
						myObject[p] = parseText(escapeJS(obj[p]));
					}
				}else{
					if (obj[p] instanceof Array){
						myObject[p] = [];
						for (var i = 0;i < obj[p].length;i++){
							myObject[p][i] = new JXONTree(obj[p][i]);
							mes = arguments.callee(obj[p][i],myObject[p][i]);
							if (mes){return mes};
						}
						i = void(null); 
					}else if(obj[p] instanceof Object){
						myObject[p] = new JXONTree(obj[p]);
						mes = arguments.callee(obj[p],myObject[p]);
						if (mes){return mes};
					}else{
						myObject[p] = parseText(escapeJS(obj[p]));
					}
				}
				p = void(null);
			}
		}
	})(object,mySelfObject);
	if (mes){
		e = new Error(mes);
		e.name = 'JXONError';
		throw e;
	}

	return mySelfObject;
}


	function callBackf(mes){
		try {
			console.error(mes);
		}catch (e){
			Debug.write(mes);
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
		if (/^\s*$|^null$/i.test(value)){
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



	build : function(oDoc){
		if (!oDoc){return false};
		if (!'childNodes' in oDoc){return false};
		this.empty();
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
								var oAttr = oNodeLists[n].attributes;	//ATTRIBUTE_NODE
								for (var a = 0;a < oAttr.length;a++){
									object[name][n]['@'+oAttr[a].nodeName] = parseText(oAttr[a].nodeValue);
								}
								oAttr = a = void(null);
								arguments.callee(oNodeLists[n] , object[name][n]);
								oNode.removeChild(oNodeLists[n]);
							}
							n = void(null);
						}else{
							object[name] = new JXONTree();
							var oAttr = oNodes[i].attributes;	//ATTRIBUTE_NODE
							for (var a = 0;a < oAttr.length;a++){
								object[name]['@'+oAttr[a].nodeName] = parseText(oAttr[a].nodeValue);
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
						object['?'+name] = value;
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
		return this;
	},



	toDOM : function(oDocument){
		var oDocument = oDocument || document;
		if (!'createElement' in oDocument){return false};
		var oRoot = oDocument.createElement('div');
		if (!'appendChild' in oRoot){return false};
		(function(object,oNode){
			for (var p in object){
				if (object[p] == null || object[p].constructor != Function){
					if (/^\?([\w\-]+)$/.exec(p)){
						if ('createProcessingInstruction' in oDocument){
							oNode.appendChild(oDocument.createProcessingInstruction(RegExp.lastParen , unescapeJS(object[p]).replace(/\?\>/gm,"&#03f;&gt;")));
						}
					}else if (/^@xmlns:?([\w\-]+)?$/.exec(p)){
					}else if (/^@([\w\-]+:?[\w\-]+)$/.exec(p)){
						oNode.setAttribute(RegExp.lastParen , unescapeJS(object[p]));
					}else if (/^#text$/i.test(p)){
						if (object[p]){
							oNode.appendChild((hasMarkup(object[p]) && ('createCDATASection' in oDocument && oRoot.tagName == 'div')) ? oDocument.createCDATASection(unescapeJS(object[p])) : oDocument.createTextNode(unescapeJS(object[p])));
						}
					}else if(/^#comment$/i.test(p)){
						if ('createComment' in oDocument){
							oNode.appendChild(oDocument.createComment(unescapeJS(object[p]).replace(/\-\-/gm,"\\-\\-")));
						}
					}else {
						if (object[p] instanceof Array){
							for (var i = 0;i < object[p].length;i++){
								arguments.callee(object[p][i] , oNode.appendChild(oDocument.createElement(p)));
							}
							i = void(null);
						}else if(object[p] instanceof JXONTree){
							arguments.callee(object[p] , oNode.appendChild(oDocument.createElement(p)));
						}else{
							if(parseText(object[p]) != null){
								oNode.appendChild(oDocument.createElement(p)).appendChild((hasMarkup(object[p]) &&('createCDATASection' in oDocument && oRoot.tagName == 'div')) ? oDocument.createCDATASection(unescapeJS(object[p])) : oDocument.createTextNode(unescapeJS(object[p])));
							}else{
								oNode.appendChild(oDocument.createElement(p));
							}
						}
					}
				}
				p = void(null);
			}
		})(this,oRoot);
		oDocument = void(null);
		return (oRoot.childNodes.length > 1) ? oRoot.childNodes : oRoot.lastChild ;
	},



	toDOMString : function (oDocument){
		var oDocument = oDocument || document;
		if (!'createElement' in oDocument){return false};
		var oRoot = oDocument.createElement('div');
		if (!'appendChild' in oRoot){return false};
		var oNodes = this.toDOM(oDocument);
		if (oNodes.parentNode){
			oRoot.appendChild(oNodes);
		}else if(oNodes.length){
			for (var i = 0;i < oNodes.length;i++){
				oRoot.appendChild(oNodes[i]);
			}
			i = void(null);
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
			}else if(object instanceof JXON){
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



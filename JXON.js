/*

	JXON [Javascript XML Object Notation] library

	MDN JXON https://developer.mozilla.org/en-US/docs/JXON

	This is unofficial library.

	MIT Lisence Copyright (c) 2015 mu-tan8(theta)

*/


/*
	How To Use

	//object to JXONObject
		var object = {'form':{'@method':'post','@action':'.','input':[{'@name':'uname'},{'@name':'upw','@type':'password'},{'@type':'submit','@value':'login'}]}};
		var JXON = new JXON(object);
	//XML or HTML to JXONObject
		var JXON = new JXON().build(doc);
	//JXONObject to HTML on browser
		var HTMLNode = JXON.toDOM();
		//document.body.appendChild(HTMLNode);
	//get HTML Strings value option (near eq. JXON.toDOM().innerHTML;)
		var HTMLStrings = JXON.toDOMString();
	//JXONObject to XML
		var XMLNode = JXON.toDOM(XMLObject);
		//XMLObject.getElementsByTagName('node')[0].appendChild(XMLNode);
*/

var JXONTree = function (object){
	JXON.call(this , object);
	this.build = function (){};
}

function JXON(object){

	var myObject = this ;
	var mes = (function(obj,myObject){
		if (obj instanceof Array){
			return 'Object construction error';
		}else if(obj instanceof Object){
			for (var p in obj){
				if (/^(:|\d|.+[@#!?$%\"\'\=\<\>\/\\\s])/.test(p)){
					return 'Object illegal name';
				}else if (/^(@xmlns:?[\w]*|@[\w]+:?[\w]+|#text)$/.test(p)){
					if (obj[p] instanceof Array || obj[p] instanceof Object){
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
	})(object,myObject);
	if (mes){
		e = new Error(mes);
		e.name = 'JXONError';
		throw e;
	}
	return myObject;
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
		if (/^\s*$|null/i.test(value)){
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

	empty : function(){
		var myObject = this;
		for (var p in myObject){
			myObject[p] = void(myObject[p]);
			p = void(null);
		}
		return new JXONTree();
	},

	build : function(oDoc){
		var myObject = this;
		if (!oDoc){return false};
		if (!'childNodes' in oDoc){return false};
		myObject = myObject.empty();
		(function(oNode , object){
			var oNodes = oNode.childNodes;
			for (var i = 0;i < oNodes.length;i++){
				var name = oNodes[i].nodeName;
				var value = oNodes[i].nodeValue;
				switch (oNodes[i].nodeType){
					case 1 :	//ELEMENT
						var oNodeLists = getNamedChildren(oNode,name);
						if (oNodeLists.length > 1){
							object[name] = [];
							for (var n = 0;n < oNodeLists.length;n++){
								object[name][n] = new JXONTree();
								var oAttr = oNodeLists[n].attributes;	//ATTRIBUTE
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
							var oAttr = oNodes[i].attributes;	//ATTRIBUTE
							for (var a = 0;a < oAttr.length;a++){
								object[name]['@'+oAttr[a].nodeName] = parseText(oAttr[a].nodeValue);
							}
							oAttr = a = void(null);
							arguments.callee(oNodes[i] , object[name]);
						}
						oNodeLists = void(null);
						break;
					case 3 :	//TEXT
						object['#text'] = parseText(value);
						break;
					default :
						break;
				}
				name = value = void(null);
			}
			oNodes = i = void(null);
		})(oDoc,myObject);
		return myObject;
	},

	toDOM : function(oDocument){
		var myObject = this;
		var oDocument = oDocument || document;
		if (!'createElement' in oDocument){return false};
		var oRoot = oDocument.createElement('div');
		if (!'appendChild' in oRoot){return false};
		(function(object,oNode){
			for (var p in object){
				if (object[p] === null || object[p].constructor != Function){
					if (/^@xmlns:?([\w]+)?$/.exec(p)){
					}else if (/^@([\w]+:?[\w]+)$/.exec(p)){
						oNode.setAttribute(RegExp.lastParen , unescapeJS(object[p]));
					}else if (/^#text$/.test(p)){
						if (object[p]){
							oNode.appendChild((hasMarkup(object[p]) && 'createCDATASection' in oDocument) ? oDocument.createCDATASection(unescapeJS(object[p])) : oDocument.createTextNode(unescapeJS(object[p])));
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
								oNode.appendChild(oDocument.createElement(p)).appendChild((hasMarkup(object[p]) && 'createCDATASection' in oDocument) ? oDocument.createCDATASection(unescapeJS(object[p])) : oDocument.createTextNode(unescapeJS(object[p])));
							}else{
								oNode.appendChild(oDocument.createElement(p));
							}
						}
					}
					p = void(null);
				}
			}
		})(myObject,oRoot);
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

JXONTree.prototype = JXON.prototype;
JXONTree.prototype.constructor = JXONTree;



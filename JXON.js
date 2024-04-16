//{
	class JXONTree extends EventTarget {
		constructor(){
			super();
			if (!(this instanceof JXON)){
				throw new Error();
			}
			Object.defineProperties(this,{
				_parent:{
					get (){
						return null;
					}
				},
				_owner:{
					get (){
						return null;
					}
				}
			});
		}
		#_ = Object.create(JXONTree.prototype);
		#_ondone = null;
		get ondone(){
			return (this.constructor.name == 'JXON') ? this.#_ondone : this._owner.#_ondone ;
		}
		set ondone(p){
			if (p === null || p.constructor.name.toLowerCase() === 'function'){
				if (this.constructor.name == 'JXON'){
					if (p !== this.#_ondone) this.removeEventListener('done',this.#_ondone);
					if (p) this.addEventListener('done',p);
					this.#_ondone = p;
				}else{
					if (p !== this._owner.#_ondone) this._owner.removeEventListener('done',this._owner.#_ondone);
					if (p) this._owner.addEventListener('done',p);
					this._owner.#_ondone = p;
				}
			}
		}
		#_onfail = null;
		get onfail(){
			return (this.constructor.name == 'JXON') ? this.#_onfail : this._owner.#_onfail ;
		}
		set onfail(p){
			if (p === null || p.constructor.name.toLowerCase() === 'function'){
				if (this.constructor.name == 'JXON'){
					if (p !== this.#_onfail) this.removeEventListener('fail',this.#_onfail);
					if (p) this.addEventListener('fail',p);
					this.#_onfail = p;
				}else{
					if (p !== this._owner.#_onfail) this._owner.removeEventListener('fail',this._owner.#_onfail);
					if (p) this._owner.addEventListener('fail',p);
					this._owner.#_onfail = p;
				}
			}
		}
		#_exlock = Object.create(null);
		stringify(){
			const sanitize = (v)=>{
					return (typeof v == 'string' 
						? '"'+([
								['\\','\\\\'],
								['"','\\"'],
								['\t','\\t'],
								['\n','\\n'],
								['\r','\\r'],
								['\f','\\f'],
								['\b','\\b']
							].reduce((c,[b,a])=>c = c.replaceAll(b,a),v)
							)+'"' 
						: (
							(typeof v == 'object' && Object.values(v).length === 0) ||
							(v === null || typeof v == 'undefined') 
								? null 
								: v 
							)) ; 
				} ,
				frag = (w)=>(w.every(([k,v])=>isNaN(k))) 
					? '{'+w.map(([k,v])=>`"${k}":${v}`).join(',')+'}' 
					: [
						'['+w.filter(([k,v])=>!isNaN(k)).map(([k,v])=>v).join(',')+']',
						w.filter(([k,v])=>isNaN(k)).map(([k,v])=>`"${k}":${v}`).join(',')
					].filter((c)=>c).join(',') ,
				rec = (o)=>{
					return Promise.all(Object.entries(o).filter(([k,v])=>!(['length','_parent','_owner'].includes(k))).map(([k,v])=>{
						let id , p = new Promise((r,f)=>{
							id = setTimeout(async()=>{
								try {
									r([
										k,(typeof v == 'object' && Object.keys(v).length) 
											? await rec(v)
												.then((w)=>frag(w))
											: sanitize(v)
									]);
								}catch(e){
									f(e);
								}
							});
						});
						p.id = id;
						return p;
					})).then((w)=>w.map((e)=>{
						if (e) clearTimeout(e.id);
						return e;
					}));
				}
			return rec(this)
				.then((w)=>frag(w))
				.then((w)=>{
					this.dispatchEvent(new CustomEvent('done',{
						detail:{
							result:w ,
							resultType:1
						}
					}));
					return w;
				})
				.catch((w)=>{
					this.dispatchEvent(new CustomEvent('fail',{
						detail:{
							message:w
						}
					}));
					return w;
				});
		}
		branch (obj){
			const [LOCK,DATA] = [{configurable:true} , {enumerable:true}] ,
				rec = (o)=>{
					return Promise.all(Object.entries(o).map(([k,v])=>{
						let id , p = new Promise((r,f)=>{
							id = setTimeout(async()=>{
								try {
									if (isNaN(k)){
										if (k.startsWith('@')){
											r([k,{value:(typeof v == 'object') ? Object.create(JXONTree.prototype) : v,...DATA}]);
										}else{
											r(void(0));
										}
									}else{
										let blockNodes = (typeof v == 'object' && v) ? await Promise.all(Object.entries(v).map(([n,e])=>{
											let id2 , p2 = new Promise((r2,f2)=>{
												id2 = setTimeout(async()=>{
													try {
														if (n.startsWith('#')){
															r2([n,{value:(typeof e == 'object') ? Object.create(JXONTree.prototype) : e,...DATA}]);
														}else if (n.startsWith('?')){
															r2([n,{value:(typeof e == 'object') ? Object.create(JXONTree.prototype) : e,...DATA}]);
														}else if (n.startsWith('@xmlns')){
															r2([n,{value:(typeof e == 'object') ? Object.create(JXONTree.prototype) : e,...DATA}]);
														}/*else if (/^\W/.test(n)){
															r2(void(0));
														}*/else if (/^\w+/.test(n)){
															let res = (e) ? await rec(e) : [] ;
															r2([n,{
																value:(typeof e == 'object' && e && Object.keys(e).length) 
																	? Object.create(JXONTree.prototype,Object.fromEntries(res.concat([
																		['length',{value:Object.values(res).filter((c)=>!isNaN(c[0])).length,writable:true}] ,
																		['_owner',{get (){return owner;}}] ,
																		...Object.entries(v).filter(([a,x])=>a.startsWith('@')).map(([a,x])=>[a,{value:x,...DATA}])
																	]).filter((c)=>c))) 
																	: e || Object.create(JXONTree.prototype,{'_owner':{get (){return owner;}}}),...DATA
																}
															]);
														}else{
															r2(void(0));
														}
													}catch(e){
														f2(e);
													}
												});
											});
											p2.id = id2;
											return p2;
										})).then((w)=>w.map((e)=>{
											if (e) clearTimeout(e.id);
											return e;
										})) : [] ;
										blockNodes = Object.create(JXONTree.prototype,Object.fromEntries(blockNodes.filter((c)=>c)));
										Object.values(blockNodes).forEach((v)=>{
											if (typeof v == 'object' && v){
												Object.values(v).forEach((e)=>{
													if (typeof e == 'object' && e){
														Object.defineProperties(e,{
															'_owner':{
																get (){
																	return owner;
																}
															},
															'_parent':{
																get (){
																	return blockNodes;
																}
															}
														});
														Object.preventExtensions(e);
													}
												});
												Object.preventExtensions(v);
											}
										});
										r([k,{value:blockNodes,...DATA}]);
									}
								}catch(e){
									f(e);
								}
							});
						});
						p.id = id;
						return p;
					})).then((w)=>w.map((e)=>{
						if (e) clearTimeout(e.id);
						return e;
					}));
				} , 
				owner = this ,
				[targ,lock] = [Object.keys(this)[0] || 'this object',Object.create(null)];
			if (this.constructor.name == 'JXON'){
				if (targ in this.#_exlock){
					return Promise.reject(''+targ+' is locked.');
				}
				this.#_exlock = Object.create(null,{[targ]:{value:lock,...LOCK}});
				return Promise.resolve(obj)
					.then(async(w)=>{
						const root = Object.create(JXONTree.prototype,{'length':{value:0,writable:true}});
						let names = Object.values(w) ,
							values = w ,
							sIdx = names.findIndex((v)=>Object.entries(v).find(([n,e])=>
								n == '!doctype' && 
								(Object.keys(e).find((c)=>c == 'publicID') && Object.keys(e).find((c)=>c == 'systemID'))
							)) ,
							eIdx = names.findIndex((v)=>Object.entries(v).find(([n,e])=>/^[a-zA-Z]/.test(n)));
							if (names.constructor.name != values.constructor.name){
								throw new Error('unsupported format');
							}
						let [H,B,F,T] = [[sIdx,sIdx+1],[sIdx+1,eIdx],[eIdx,eIdx+1],[eIdx+1,]].map(([a,b])=>values.slice(a,b));
						Array.prototype.push.apply(root,([]).concat([
							(typeof H == 'object' && H && Object.keys(H).length) 
								? Object.create(JXONTree.prototype,Object.fromEntries(
										Object.entries(H[0]).map(([k,v])=>[k,{value:Object.create(JXONTree.prototype,Object.fromEntries(
											Object.entries(v).map(([n,e])=>[n,{value:e,...DATA}])
										)),...DATA}])
									)) 
								: void(0) ,
							...B.filter((v)=>Object.keys(v).some((n)=>n == '#comment' || n.startsWith('?')))
								.map((e)=>Object.create(JXONTree.prototype,Object.fromEntries(
									Object.entries(e).map(([k,v])=>[k,{value:v,...DATA}])
								))) ,
							(await rec(F))[0][1].value ,
							...Object.values(T).filter((v)=>Object.keys(v).some((n)=>n == '#comment' || n.startsWith('?')))
								.map((e)=>Object.create(JXONTree.prototype,Object.fromEntries(
									Object.entries(e).map(([k,v])=>[k,{value:v,...DATA}])
								))) ,
						]).filter((c)=>c));
						Object.values(root).forEach((v)=>{
							if (typeof v == 'object' && v){
								Object.defineProperties(v,{
									'_parent':{
										get (){
											return root;
										}
									},
									'_owner':{
										get (){
											return owner;
										}
									}
								});
								if (/^[^@\?\!#0-9]/.test(Object.keys(v)[0])){
									Object.defineProperties(v,Object.fromEntries(
										Object.keys(this.#_exlock[targ])
										.map((n)=>['@xmlns'+(n ? ':' : '')+n,{value:this.#_exlock[targ][n],...DATA}])
									));
								}
								Object.preventExtensions(v);
							}
						});
						Object.defineProperty(root,'length',{value:Object.keys(root).length,writable:true});
						this.#_ = root;
						Object.preventExtensions(root);
						Object.defineProperty(this,'length',{
							get (){
								return root.length;
							},set (p){
								root.length = p;
							}
						});
						return Object.defineProperties(this,Object.fromEntries(
							Object.values(root).map((k,i)=>[i,{
								get (){
									return root[i];
								},
								set(p){
									root[i] = p;
								},enumerable:true
							}])
						));
					})
					.then((w)=>{
						this.dispatchEvent(new CustomEvent('done',{
							detail:{
								result:this ,
								resultType:0
							}
						}));
						return this;
					})
					.catch((w)=>{
						this.dispatchEvent(new CustomEvent('fail',{
							detail:{
								message:w
							}
						}));
						return w;
					})
					.finally((w)=>{
						delete this.#_exlock[targ];
						return w;
					});
			}else{
				let exlock = this._owner.#_exlock;
				return Promise.reject(void(0));
			}
		}
		graft (doc){
			const [LOCK,DATA] = [{configurable:true} , {enumerable:true}] ,
				lst = (elem)=>{
					return (elem.attributes && elem.attributes.length > 0) ? 
						[...elem.attributes].map((n)=>['@'+n.nodeName,{value:n.nodeValue,...DATA}]) : [] ;
				},
				rec = (node)=>{
					return Promise.all([...node.childNodes].map((e,i)=>{
						let id , p = new Promise((r,f)=>{
							id = setTimeout(async()=>{
								try {
									let blockNodes;
									switch(e.nodeType){
										case 10 :
											blockNodes = Object.create(JXONTree.prototype,{
												'!doctype':{value:Object.create(JXONTree.prototype,{
													'publicID':{value:e.publicId,...DATA},
													'systemID':{value:e.systemId,...DATA}
												}),...DATA}
											});
											Object.values(blockNodes['!doctype']).map((v)=>Object.preventExtensions(v));
											Object.preventExtensions(blockNodes['!doctype']);
											break;
										default :
											if (e.namespaceURI){
												this.#_exlock[targ][e.prefix || ''] = e.namespaceURI;
											}
											let res = await rec(e) , 
												value = Object.create(JXONTree.prototype,Object.fromEntries(
													lst(e)
														.concat(res,[
															['length',{value:Object.values(res).length,writable:true}],
															['_owner',{get (){return owner}}]
														])
														.filter((e)=>e)
												)) , 
												name = (e.tagName && !flg) ? e.tagName.toLowerCase() : (e.nodeType === 7 ? '?' : '')+e.nodeName;
											blockNodes = Object.create(JXONTree.prototype,{
												[name]:{value:(e.childNodes && e.childNodes.length || e.attributes && e.attributes.length) ? value : 
													(e.nodeValue || Object.create(JXONTree.prototype)),...DATA}
											});
											if (e.prefix === null && this.#_exlock[targ][''] !== e.namespaceURI) Object.defineProperty(blockNodes,'@xmlns',{value:e.namespaceURI,...DATA});
											if (typeof blockNodes[name] == 'object'){
												Object.values(blockNodes[name]).forEach((v)=>{
													if (typeof v == 'object'){
														Object.defineProperties(v,{
															'_parent':{
																get (){
																	return blockNodes;
																}
															},
															'_owner':{
																get (){
																	return owner;
																}
															}
														});
													}
													Object.preventExtensions(v);
												});
											}
											Object.preventExtensions(blockNodes[name]);
											break;
									}
									r([i,{value:blockNodes,...DATA}]);
								}catch(e){
									f(e);
								}
							});
						});
						p.id = id;
						return p;
					})).then((w)=>w.map((e)=>{
						if (e) clearTimeout(e.id);
						return e;
					}));
				},
				flg = doc.createElement('div').tagName == 'div' , 
				owner = this ,
				[targ,lock] = [Object.keys(this)[0] || 'this object',Object.create(null)];
			if (this.constructor.name == 'JXON'){
				if (targ in this.#_exlock){
					return Promise.reject(''+targ+' is locked');
				}
				this.#_exlock = Object.create(null,{[targ]:{value:lock,...LOCK}});
				return rec(doc)
					.then((w)=>{
						const root = Object.create(JXONTree.prototype,Object.fromEntries(w));
						Object.values(root).forEach((v)=>{
							if (typeof v == 'object'){
								Object.defineProperties(v,{
									'_parent':{
										get (){
											return root;
										}
									},
									'_owner':{
										get (){
											return owner;
										}
									}
								});
								if (/^[^@\?\!#0-9]/.test(Object.keys(v)[0])){
									Object.defineProperties(v,Object.fromEntries(
										Object.keys(this.#_exlock[targ])
										.map((n)=>['@xmlns'+(n ? ':' : '')+n,{value:this.#_exlock[targ][n],...DATA}])
									));
								}
								Object.preventExtensions(v);
							}
						});
						Object.defineProperty(root,'length',{value:Object.keys(root).length,writable:true});
						this.#_ = root;
						Object.preventExtensions(root);
						Object.defineProperty(this,'length',{
							get (){
								return root.length;
							},
							set (p){
								root.length = p;
							}
						});
						return Object.defineProperties(this,Object.fromEntries(
							w.map(([k,v])=>[k,{
								get (){
									return root[k];
								},
								set (p){
									root[k] = p;
								},enumerable:true
							}])
						));
					})
					.then((w)=>{
						this.dispatchEvent(new CustomEvent('done',{
							detail:{
								result:this ,
								resultType:0
							}
						}));
						return this;
					})
					.catch((w)=>{
						this.dispatchEvent(new CustomEvent('fail',{
							detail:{
								message:w
							}
						}));
						return w;
					})
					.finally((w)=>{
						delete this.#_exlock[targ];
						return w;
					});
			}else{
				let exlock = this._owner.#_exlock;
				return Promise.reject(void(0));
			}
		}
		write (opt){
			const idx = Object.keys(this).findIndex((k)=>Object.keys(this[k]).find((e)=>(/^[^@\?\!#0-9]/).test(e))),
				name = Object.keys(this[idx])[0] ,
				URI = Object.fromEntries(
						Object.keys(this[idx]).filter((e)=>e.includes('@xmlns')).map((e)=>[
							e.replace('@xmlns','').replace(':',''),
							this[idx][e]
						])
					) , 
				flg = (opt && name.toLowerCase().split(':').at(-1).includes('html') && 
					(URI[name.split(':')[0]] == 'http://www.w3.org/1999/xhtml' || URI[''] == 'http://www.w3.org/1999/xhtml')) ,
				doc = (flg) 
					? document.implementation.createHTMLDocument() 
					: document.implementation.createDocument(URI[Object.keys(URI).find((e)=>name.split(':')[0].includes(e))] || URI[''] || null,name,null) ,
				rec = (o,node)=>{
					return Promise.all(Object.entries(o).map(([k,v])=>{
						let id , p = new Promise((r,f)=>{
							id = setTimeout(async()=>{
								try {
									if (isNaN(k)){
										if (k.startsWith('#')){
											switch (k){
												case '#text':
													r(node.appendChild(doc.createTextNode(v)));
													break;
												case '#comment':
													r(node.appendChild(doc.createComment(v)));
													break;
												default :
													if (!flg && k == '#cdata-section'){
														r(node.appendChild(doc.createCDATASection(v)));
													}else{
														r(void(0));
													}
													break;
											}
										}else if (k.startsWith('@')){
											if (k.includes('@xmlns')){
												r(void(0));
											}else{
												let ns = (k.includes(':')) ? URI[Object.keys(URI).find((e)=>k.split(':')[0].includes(e))] : null;
												r((flg) ? node.setAttribute(k.slice(1).split(':').at(-1),v) : node.setAttributeNS(ns,k.slice(1),v));
											}
										}else{
											if (!flg && k.startsWith('?')){
												r(node.appendChild(doc.createProcessingInstruction(k.slice(1),v)));
											}else{
												let ns = URI[Object.keys(URI).find((e)=>k.split(':')[0].includes(e))] || o['@xmlns'] || URI[''] || null ,
													elem = node.appendChild((flg) ? doc.createElement(k.split(':').at(-1)) : doc.createElementNS(ns,k));
												r((v !== null && Object.keys(v).length) ? await rec(v,elem) : elem );
											}
										}
									}else{
										r(await rec(v,node));
									}
								}catch(e){
									f(e);
								}
							});
						});
						p.id = id;
						return p;
					})).then((w)=>w.map((e)=>{
						if (e) clearTimeout(e.id);
						return e;
					}));
				}
			[...doc.documentElement.children].forEach((e)=>{
				e.remove();
			});
			Object.values(this).slice(0,idx).reverse().map((e)=>Object.entries(e)[0]).reduce((c,[k,v])=>{
				if (k == '!doctype' && doc.doctype === null){
					c = doc.insertBefore(document.implementation.createDocumentType(name,v.publicID || '',v.systemID || ''),c);
				}else if (k == '#comment'){
					c = doc.insertBefore(doc.createComment(v),c);
				}else if (!flg && k.startsWith('?')){
					c = doc.insertBefore(doc.createProcessingInstruction(k.slice(1),v),c);
				}
				return c;
			},doc.documentElement);
			Object.values(this).slice(idx).map((e)=>Object.entries(e)[0]).reduce((c,[k,v])=>{
				if (k == '#comment'){
					c = doc.appendChild(doc.createComment(v));
				}else if (!flg && k.startsWith('?')){
					c = doc.appendChild(doc.createProcessingInstruction(k.slice(1),v));
				}
				return c;
			});
			return rec(this[idx][name],doc.documentElement)
				.then((w)=>{
					this.dispatchEvent(new CustomEvent('done',{
						detail:{
							result:doc ,
							resultType:(flg) ? 3 : 2
						}
					}));
					return doc;
				})
				.catch((w)=>{
					this.dispatchEvent(new CustomEvent('fail',{
						detail:{
							message:w
						}
					}));
					return w;
				});
		}
	}
	class JXON extends JXONTree {
		constructor(){
			super();
		}
		build(obj){
			if ('documentElement' in obj){
				return super.graft(obj);
			}else{
				return super.branch(obj);
			}
		}
		unbuild(flg){
			return super.write(flg);
		}
		stringify(){
			return super.stringify();
		}
	}
//}
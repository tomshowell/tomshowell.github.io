
(function(l, r) { if (l.getElementById('livereloadscript')) return; r = l.createElement('script'); r.async = 1; r.src = '//' + (window.location.host || 'localhost').split(':')[0] + ':35734/livereload.js?snipver=1'; r.id = 'livereloadscript'; l.getElementsByTagName('head')[0].appendChild(r) })(window.document);
var app = (function () {
    'use strict';

    function noop() { }
    function assign(tar, src) {
        // @ts-ignore
        for (const k in src)
            tar[k] = src[k];
        return tar;
    }
    function add_location(element, file, line, column, char) {
        element.__svelte_meta = {
            loc: { file, line, column, char }
        };
    }
    function run(fn) {
        return fn();
    }
    function blank_object() {
        return Object.create(null);
    }
    function run_all(fns) {
        fns.forEach(run);
    }
    function is_function(thing) {
        return typeof thing === 'function';
    }
    function safe_not_equal(a, b) {
        return a != a ? b == b : a !== b || ((a && typeof a === 'object') || typeof a === 'function');
    }
    function is_empty(obj) {
        return Object.keys(obj).length === 0;
    }
    function create_slot(definition, ctx, $$scope, fn) {
        if (definition) {
            const slot_ctx = get_slot_context(definition, ctx, $$scope, fn);
            return definition[0](slot_ctx);
        }
    }
    function get_slot_context(definition, ctx, $$scope, fn) {
        return definition[1] && fn
            ? assign($$scope.ctx.slice(), definition[1](fn(ctx)))
            : $$scope.ctx;
    }
    function get_slot_changes(definition, $$scope, dirty, fn) {
        if (definition[2] && fn) {
            const lets = definition[2](fn(dirty));
            if ($$scope.dirty === undefined) {
                return lets;
            }
            if (typeof lets === 'object') {
                const merged = [];
                const len = Math.max($$scope.dirty.length, lets.length);
                for (let i = 0; i < len; i += 1) {
                    merged[i] = $$scope.dirty[i] | lets[i];
                }
                return merged;
            }
            return $$scope.dirty | lets;
        }
        return $$scope.dirty;
    }
    function update_slot(slot, slot_definition, ctx, $$scope, dirty, get_slot_changes_fn, get_slot_context_fn) {
        const slot_changes = get_slot_changes(slot_definition, $$scope, dirty, get_slot_changes_fn);
        if (slot_changes) {
            const slot_context = get_slot_context(slot_definition, ctx, $$scope, get_slot_context_fn);
            slot.p(slot_context, slot_changes);
        }
    }

    function append(target, node) {
        target.appendChild(node);
    }
    function insert(target, node, anchor) {
        target.insertBefore(node, anchor || null);
    }
    function detach(node) {
        node.parentNode.removeChild(node);
    }
    function destroy_each(iterations, detaching) {
        for (let i = 0; i < iterations.length; i += 1) {
            if (iterations[i])
                iterations[i].d(detaching);
        }
    }
    function element(name) {
        return document.createElement(name);
    }
    function text(data) {
        return document.createTextNode(data);
    }
    function space() {
        return text(' ');
    }
    function empty() {
        return text('');
    }
    function listen(node, event, handler, options) {
        node.addEventListener(event, handler, options);
        return () => node.removeEventListener(event, handler, options);
    }
    function attr(node, attribute, value) {
        if (value == null)
            node.removeAttribute(attribute);
        else if (node.getAttribute(attribute) !== value)
            node.setAttribute(attribute, value);
    }
    function children(element) {
        return Array.from(element.childNodes);
    }
    function set_input_value(input, value) {
        input.value = value == null ? '' : value;
    }
    function set_style(node, key, value, important) {
        node.style.setProperty(key, value, important ? 'important' : '');
    }
    function custom_event(type, detail) {
        const e = document.createEvent('CustomEvent');
        e.initCustomEvent(type, false, false, detail);
        return e;
    }

    let current_component;
    function set_current_component(component) {
        current_component = component;
    }

    const dirty_components = [];
    const binding_callbacks = [];
    const render_callbacks = [];
    const flush_callbacks = [];
    const resolved_promise = Promise.resolve();
    let update_scheduled = false;
    function schedule_update() {
        if (!update_scheduled) {
            update_scheduled = true;
            resolved_promise.then(flush);
        }
    }
    function add_render_callback(fn) {
        render_callbacks.push(fn);
    }
    let flushing = false;
    const seen_callbacks = new Set();
    function flush() {
        if (flushing)
            return;
        flushing = true;
        do {
            // first, call beforeUpdate functions
            // and update components
            for (let i = 0; i < dirty_components.length; i += 1) {
                const component = dirty_components[i];
                set_current_component(component);
                update(component.$$);
            }
            set_current_component(null);
            dirty_components.length = 0;
            while (binding_callbacks.length)
                binding_callbacks.pop()();
            // then, once components are updated, call
            // afterUpdate functions. This may cause
            // subsequent updates...
            for (let i = 0; i < render_callbacks.length; i += 1) {
                const callback = render_callbacks[i];
                if (!seen_callbacks.has(callback)) {
                    // ...so guard against infinite loops
                    seen_callbacks.add(callback);
                    callback();
                }
            }
            render_callbacks.length = 0;
        } while (dirty_components.length);
        while (flush_callbacks.length) {
            flush_callbacks.pop()();
        }
        update_scheduled = false;
        flushing = false;
        seen_callbacks.clear();
    }
    function update($$) {
        if ($$.fragment !== null) {
            $$.update();
            run_all($$.before_update);
            const dirty = $$.dirty;
            $$.dirty = [-1];
            $$.fragment && $$.fragment.p($$.ctx, dirty);
            $$.after_update.forEach(add_render_callback);
        }
    }
    const outroing = new Set();
    let outros;
    function group_outros() {
        outros = {
            r: 0,
            c: [],
            p: outros // parent group
        };
    }
    function check_outros() {
        if (!outros.r) {
            run_all(outros.c);
        }
        outros = outros.p;
    }
    function transition_in(block, local) {
        if (block && block.i) {
            outroing.delete(block);
            block.i(local);
        }
    }
    function transition_out(block, local, detach, callback) {
        if (block && block.o) {
            if (outroing.has(block))
                return;
            outroing.add(block);
            outros.c.push(() => {
                outroing.delete(block);
                if (callback) {
                    if (detach)
                        block.d(1);
                    callback();
                }
            });
            block.o(local);
        }
    }

    const globals = (typeof window !== 'undefined'
        ? window
        : typeof globalThis !== 'undefined'
            ? globalThis
            : global);
    function create_component(block) {
        block && block.c();
    }
    function mount_component(component, target, anchor, customElement) {
        const { fragment, on_mount, on_destroy, after_update } = component.$$;
        fragment && fragment.m(target, anchor);
        if (!customElement) {
            // onMount happens before the initial afterUpdate
            add_render_callback(() => {
                const new_on_destroy = on_mount.map(run).filter(is_function);
                if (on_destroy) {
                    on_destroy.push(...new_on_destroy);
                }
                else {
                    // Edge case - component was destroyed immediately,
                    // most likely as a result of a binding initialising
                    run_all(new_on_destroy);
                }
                component.$$.on_mount = [];
            });
        }
        after_update.forEach(add_render_callback);
    }
    function destroy_component(component, detaching) {
        const $$ = component.$$;
        if ($$.fragment !== null) {
            run_all($$.on_destroy);
            $$.fragment && $$.fragment.d(detaching);
            // TODO null out other refs, including component.$$ (but need to
            // preserve final state?)
            $$.on_destroy = $$.fragment = null;
            $$.ctx = [];
        }
    }
    function make_dirty(component, i) {
        if (component.$$.dirty[0] === -1) {
            dirty_components.push(component);
            schedule_update();
            component.$$.dirty.fill(0);
        }
        component.$$.dirty[(i / 31) | 0] |= (1 << (i % 31));
    }
    function init(component, options, instance, create_fragment, not_equal, props, dirty = [-1]) {
        const parent_component = current_component;
        set_current_component(component);
        const $$ = component.$$ = {
            fragment: null,
            ctx: null,
            // state
            props,
            update: noop,
            not_equal,
            bound: blank_object(),
            // lifecycle
            on_mount: [],
            on_destroy: [],
            on_disconnect: [],
            before_update: [],
            after_update: [],
            context: new Map(parent_component ? parent_component.$$.context : options.context || []),
            // everything else
            callbacks: blank_object(),
            dirty,
            skip_bound: false
        };
        let ready = false;
        $$.ctx = instance
            ? instance(component, options.props || {}, (i, ret, ...rest) => {
                const value = rest.length ? rest[0] : ret;
                if ($$.ctx && not_equal($$.ctx[i], $$.ctx[i] = value)) {
                    if (!$$.skip_bound && $$.bound[i])
                        $$.bound[i](value);
                    if (ready)
                        make_dirty(component, i);
                }
                return ret;
            })
            : [];
        $$.update();
        ready = true;
        run_all($$.before_update);
        // `false` as a special case of no DOM component
        $$.fragment = create_fragment ? create_fragment($$.ctx) : false;
        if (options.target) {
            if (options.hydrate) {
                const nodes = children(options.target);
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment && $$.fragment.l(nodes);
                nodes.forEach(detach);
            }
            else {
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment && $$.fragment.c();
            }
            if (options.intro)
                transition_in(component.$$.fragment);
            mount_component(component, options.target, options.anchor, options.customElement);
            flush();
        }
        set_current_component(parent_component);
    }
    /**
     * Base class for Svelte components. Used when dev=false.
     */
    class SvelteComponent {
        $destroy() {
            destroy_component(this, 1);
            this.$destroy = noop;
        }
        $on(type, callback) {
            const callbacks = (this.$$.callbacks[type] || (this.$$.callbacks[type] = []));
            callbacks.push(callback);
            return () => {
                const index = callbacks.indexOf(callback);
                if (index !== -1)
                    callbacks.splice(index, 1);
            };
        }
        $set($$props) {
            if (this.$$set && !is_empty($$props)) {
                this.$$.skip_bound = true;
                this.$$set($$props);
                this.$$.skip_bound = false;
            }
        }
    }

    function dispatch_dev(type, detail) {
        document.dispatchEvent(custom_event(type, Object.assign({ version: '3.37.0' }, detail)));
    }
    function append_dev(target, node) {
        dispatch_dev('SvelteDOMInsert', { target, node });
        append(target, node);
    }
    function insert_dev(target, node, anchor) {
        dispatch_dev('SvelteDOMInsert', { target, node, anchor });
        insert(target, node, anchor);
    }
    function detach_dev(node) {
        dispatch_dev('SvelteDOMRemove', { node });
        detach(node);
    }
    function listen_dev(node, event, handler, options, has_prevent_default, has_stop_propagation) {
        const modifiers = options === true ? ['capture'] : options ? Array.from(Object.keys(options)) : [];
        if (has_prevent_default)
            modifiers.push('preventDefault');
        if (has_stop_propagation)
            modifiers.push('stopPropagation');
        dispatch_dev('SvelteDOMAddEventListener', { node, event, handler, modifiers });
        const dispose = listen(node, event, handler, options);
        return () => {
            dispatch_dev('SvelteDOMRemoveEventListener', { node, event, handler, modifiers });
            dispose();
        };
    }
    function attr_dev(node, attribute, value) {
        attr(node, attribute, value);
        if (value == null)
            dispatch_dev('SvelteDOMRemoveAttribute', { node, attribute });
        else
            dispatch_dev('SvelteDOMSetAttribute', { node, attribute, value });
    }
    function set_data_dev(text, data) {
        data = '' + data;
        if (text.wholeText === data)
            return;
        dispatch_dev('SvelteDOMSetData', { node: text, data });
        text.data = data;
    }
    function validate_each_argument(arg) {
        if (typeof arg !== 'string' && !(arg && typeof arg === 'object' && 'length' in arg)) {
            let msg = '{#each} only iterates over array-like objects.';
            if (typeof Symbol === 'function' && arg && Symbol.iterator in arg) {
                msg += ' You can use a spread to convert this iterable into an array.';
            }
            throw new Error(msg);
        }
    }
    function validate_slots(name, slot, keys) {
        for (const slot_key of Object.keys(slot)) {
            if (!~keys.indexOf(slot_key)) {
                console.warn(`<${name}> received an unexpected slot "${slot_key}".`);
            }
        }
    }
    /**
     * Base class for Svelte components with some minor dev-enhancements. Used when dev=true.
     */
    class SvelteComponentDev extends SvelteComponent {
        constructor(options) {
            if (!options || (!options.target && !options.$$inline)) {
                throw new Error("'target' is a required option");
            }
            super();
        }
        $destroy() {
            super.$destroy();
            this.$destroy = () => {
                console.warn('Component was already destroyed'); // eslint-disable-line no-console
            };
        }
        $capture_state() { }
        $inject_state() { }
    }

    /* src/Button/Button.svelte generated by Svelte v3.37.0 */

    const file$4 = "src/Button/Button.svelte";

    function create_fragment$4(ctx) {
    	let button;
    	let t;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			button = element("button");
    			t = text(/*text*/ ctx[0]);
    			attr_dev(button, "class", "bg-purple-800  text-white  border-none  px-4  py-1  rounded  text-sm");
    			attr_dev(button, "type", "button");
    			add_location(button, file$4, 5, 0, 77);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, button, anchor);
    			append_dev(button, t);

    			if (!mounted) {
    				dispose = listen_dev(
    					button,
    					"click",
    					function () {
    						if (is_function(/*onClick*/ ctx[1])) /*onClick*/ ctx[1].apply(this, arguments);
    					},
    					false,
    					false,
    					false
    				);

    				mounted = true;
    			}
    		},
    		p: function update(new_ctx, [dirty]) {
    			ctx = new_ctx;
    			if (dirty & /*text*/ 1) set_data_dev(t, /*text*/ ctx[0]);
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(button);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$4.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$4($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("Button", slots, []);
    	let { text = "" } = $$props;

    	let { onClick = () => {
    		
    	} } = $$props;

    	const writable_props = ["text", "onClick"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Button> was created with unknown prop '${key}'`);
    	});

    	$$self.$$set = $$props => {
    		if ("text" in $$props) $$invalidate(0, text = $$props.text);
    		if ("onClick" in $$props) $$invalidate(1, onClick = $$props.onClick);
    	};

    	$$self.$capture_state = () => ({ text, onClick });

    	$$self.$inject_state = $$props => {
    		if ("text" in $$props) $$invalidate(0, text = $$props.text);
    		if ("onClick" in $$props) $$invalidate(1, onClick = $$props.onClick);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [text, onClick];
    }

    class Button extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$4, create_fragment$4, safe_not_equal, { text: 0, onClick: 1 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Button",
    			options,
    			id: create_fragment$4.name
    		});
    	}

    	get text() {
    		throw new Error("<Button>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set text(value) {
    		throw new Error("<Button>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get onClick() {
    		throw new Error("<Button>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set onClick(value) {
    		throw new Error("<Button>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src/ContentBox/ContentBox.svelte generated by Svelte v3.37.0 */

    const file$3 = "src/ContentBox/ContentBox.svelte";

    function create_fragment$3(ctx) {
    	let div;
    	let current;
    	const default_slot_template = /*#slots*/ ctx[1].default;
    	const default_slot = create_slot(default_slot_template, ctx, /*$$scope*/ ctx[0], null);

    	const block = {
    		c: function create() {
    			div = element("div");
    			if (default_slot) default_slot.c();
    			attr_dev(div, "class", "rounded  bg-gray-50  px-4  py-2");
    			add_location(div, file$3, 0, 0, 0);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);

    			if (default_slot) {
    				default_slot.m(div, null);
    			}

    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			if (default_slot) {
    				if (default_slot.p && dirty & /*$$scope*/ 1) {
    					update_slot(default_slot, default_slot_template, ctx, /*$$scope*/ ctx[0], dirty, null, null);
    				}
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(default_slot, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(default_slot, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			if (default_slot) default_slot.d(detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$3.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$3($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("ContentBox", slots, ['default']);
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<ContentBox> was created with unknown prop '${key}'`);
    	});

    	$$self.$$set = $$props => {
    		if ("$$scope" in $$props) $$invalidate(0, $$scope = $$props.$$scope);
    	};

    	return [$$scope, slots];
    }

    class ContentBox extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$3, create_fragment$3, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "ContentBox",
    			options,
    			id: create_fragment$3.name
    		});
    	}
    }

    /* src/FixedContent/FixedContent.svelte generated by Svelte v3.37.0 */

    const file$2 = "src/FixedContent/FixedContent.svelte";

    function create_fragment$2(ctx) {
    	let div;
    	let current;
    	const default_slot_template = /*#slots*/ ctx[1].default;
    	const default_slot = create_slot(default_slot_template, ctx, /*$$scope*/ ctx[0], null);

    	const block = {
    		c: function create() {
    			div = element("div");
    			if (default_slot) default_slot.c();
    			set_style(div, "width", "800px");
    			set_style(div, "margin", "0 auto");
    			add_location(div, file$2, 0, 0, 0);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);

    			if (default_slot) {
    				default_slot.m(div, null);
    			}

    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			if (default_slot) {
    				if (default_slot.p && dirty & /*$$scope*/ 1) {
    					update_slot(default_slot, default_slot_template, ctx, /*$$scope*/ ctx[0], dirty, null, null);
    				}
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(default_slot, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(default_slot, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			if (default_slot) default_slot.d(detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$2.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$2($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("FixedContent", slots, ['default']);
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<FixedContent> was created with unknown prop '${key}'`);
    	});

    	$$self.$$set = $$props => {
    		if ("$$scope" in $$props) $$invalidate(0, $$scope = $$props.$$scope);
    	};

    	return [$$scope, slots];
    }

    class FixedContent extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$2, create_fragment$2, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "FixedContent",
    			options,
    			id: create_fragment$2.name
    		});
    	}
    }

    const config = {
     API_KEY: '73bfcf5e-5e98-42a7-a7f8-719492c65473',
    };

    const headers = {
      'accept': 'application/json',
      'Authorization': `Bearer ${config.API_KEY}`,
    };

    const getPlayerInfo = async (nickname) => {
      const response = await fetch(`https://open.faceit.com/data/v4/players?nickname=${nickname}`, {
        method: 'GET',
        headers,
      });

      return response.json();
    };

    const getPlayerMatchHistory = async (playerId, game = 'csgo') => {
      const matches = [];
      let offsetAmount = 0;
      let reachedEnd = false;

      while (!reachedEnd) {
        const response = await fetch(`https://open.faceit.com/data/v4/players/${playerId}/history?game=${game}&from=0&offset=${offsetAmount}`, {
          method: 'GET',
          headers,
        });

        const responseJson = await response.json();

        if (responseJson.errors) {
          reachedEnd = true;
          console.log(responseJson.errors);
        } else {
          if (responseJson.items && responseJson.items.length > 0) {
            matches.push(...responseJson.items);
            reachedEnd = true; // Comment out to get more than recent 20
            offsetAmount += 20;
          } else {
            reachedEnd = true;
          }
        }
      }

      return matches;
    };

    const getPlayerMatchStats = async (matchId) => {
      const response = await fetch (`https://open.faceit.com/data/v4/matches/${matchId}/stats`, {
        method: 'GET',
        headers,
      });

      return response.json();
    };

    /* src/MatchData/MatchData.svelte generated by Svelte v3.37.0 */

    const { console: console_1$1 } = globals;
    const file$1 = "src/MatchData/MatchData.svelte";

    function get_each_context(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[8] = list[i];
    	return child_ctx;
    }

    // (76:2) <ContentBox>
    function create_default_slot_2(ctx) {
    	let button;
    	let t;
    	let current;

    	button = new Button({
    			props: {
    				text: "GET",
    				onClick: /*getMatchHistory*/ ctx[2]
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			create_component(button.$$.fragment);
    			t = text("\n    Get list of all match scoreboard stats");
    		},
    		m: function mount(target, anchor) {
    			mount_component(button, target, anchor);
    			insert_dev(target, t, anchor);
    			current = true;
    		},
    		p: noop,
    		i: function intro(local) {
    			if (current) return;
    			transition_in(button.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(button.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(button, detaching);
    			if (detaching) detach_dev(t);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot_2.name,
    		type: "slot",
    		source: "(76:2) <ContentBox>",
    		ctx
    	});

    	return block;
    }

    // (75:0) <FixedContent>
    function create_default_slot_1$1(ctx) {
    	let contentbox;
    	let current;

    	contentbox = new ContentBox({
    			props: {
    				$$slots: { default: [create_default_slot_2] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			create_component(contentbox.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(contentbox, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const contentbox_changes = {};

    			if (dirty & /*$$scope*/ 2048) {
    				contentbox_changes.$$scope = { dirty, ctx };
    			}

    			contentbox.$set(contentbox_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(contentbox.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(contentbox.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(contentbox, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot_1$1.name,
    		type: "slot",
    		source: "(75:0) <FixedContent>",
    		ctx
    	});

    	return block;
    }

    // (84:0) {#if matchDataLoading || matchDisplay.length > 0}
    function create_if_block$1(ctx) {
    	let contentbox;
    	let current;

    	contentbox = new ContentBox({
    			props: {
    				$$slots: { default: [create_default_slot$1] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			create_component(contentbox.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(contentbox, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const contentbox_changes = {};

    			if (dirty & /*$$scope, matchDisplay, matchDataLoading*/ 2051) {
    				contentbox_changes.$$scope = { dirty, ctx };
    			}

    			contentbox.$set(contentbox_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(contentbox.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(contentbox.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(contentbox, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$1.name,
    		type: "if",
    		source: "(84:0) {#if matchDataLoading || matchDisplay.length > 0}",
    		ctx
    	});

    	return block;
    }

    // (86:4) {#if matchDataLoading}
    function create_if_block_3$1(ctx) {
    	let t0;
    	let t1_value = /*matchDisplay*/ ctx[1].length + "";
    	let t1;
    	let t2;

    	const block = {
    		c: function create() {
    			t0 = text("Loading ");
    			t1 = text(t1_value);
    			t2 = text(" of 20");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, t0, anchor);
    			insert_dev(target, t1, anchor);
    			insert_dev(target, t2, anchor);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*matchDisplay*/ 2 && t1_value !== (t1_value = /*matchDisplay*/ ctx[1].length + "")) set_data_dev(t1, t1_value);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(t0);
    			if (detaching) detach_dev(t1);
    			if (detaching) detach_dev(t2);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_3$1.name,
    		type: "if",
    		source: "(86:4) {#if matchDataLoading}",
    		ctx
    	});

    	return block;
    }

    // (88:4) {#if matchDisplay.length > 0 && !matchDataLoading}
    function create_if_block_1$1(ctx) {
    	let small;
    	let t1;
    	let br0;
    	let br1;
    	let t2;
    	let table;
    	let tr;
    	let th0;
    	let t4;
    	let th1;
    	let t6;
    	let th2;
    	let t8;
    	let th3;
    	let t10;
    	let th4;
    	let t12;
    	let th5;
    	let t14;
    	let th6;
    	let t16;
    	let th7;
    	let t18;
    	let th8;
    	let t20;
    	let th9;
    	let t22;
    	let th10;
    	let t24;
    	let th11;
    	let t26;
    	let th12;
    	let t28;
    	let th13;
    	let t30;
    	let th14;
    	let t32;
    	let each_value = /*matchDisplay*/ ctx[1];
    	validate_each_argument(each_value);
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block(get_each_context(ctx, each_value, i));
    	}

    	const block = {
    		c: function create() {
    			small = element("small");
    			small.textContent = "* Position only based off kills, might not be correct scoreboard position based off \"points\"";
    			t1 = space();
    			br0 = element("br");
    			br1 = element("br");
    			t2 = space();
    			table = element("table");
    			tr = element("tr");
    			th0 = element("th");
    			th0.textContent = "Date";
    			t4 = space();
    			th1 = element("th");
    			th1.textContent = "W/L";
    			t6 = space();
    			th2 = element("th");
    			th2.textContent = "Score";
    			t8 = space();
    			th3 = element("th");
    			th3.textContent = "Map";
    			t10 = space();
    			th4 = element("th");
    			th4.textContent = "Pos. *";
    			t12 = space();
    			th5 = element("th");
    			th5.textContent = "Kills";
    			t14 = space();
    			th6 = element("th");
    			th6.textContent = "Assists";
    			t16 = space();
    			th7 = element("th");
    			th7.textContent = "Deaths";
    			t18 = space();
    			th8 = element("th");
    			th8.textContent = "HS %";
    			t20 = space();
    			th9 = element("th");
    			th9.textContent = "KD";
    			t22 = space();
    			th10 = element("th");
    			th10.textContent = "KR";
    			t24 = space();
    			th11 = element("th");
    			th11.textContent = "MVP";
    			t26 = space();
    			th12 = element("th");
    			th12.textContent = "3x";
    			t28 = space();
    			th13 = element("th");
    			th13.textContent = "4x";
    			t30 = space();
    			th14 = element("th");
    			th14.textContent = "5x";
    			t32 = space();

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			add_location(small, file$1, 88, 6, 2521);
    			add_location(br0, file$1, 89, 6, 2635);
    			add_location(br1, file$1, 89, 12, 2641);
    			add_location(th0, file$1, 92, 10, 2700);
    			add_location(th1, file$1, 93, 10, 2725);
    			add_location(th2, file$1, 94, 10, 2748);
    			add_location(th3, file$1, 95, 10, 2773);
    			add_location(th4, file$1, 96, 10, 2796);
    			add_location(th5, file$1, 97, 10, 2822);
    			add_location(th6, file$1, 98, 10, 2847);
    			add_location(th7, file$1, 99, 10, 2874);
    			add_location(th8, file$1, 100, 10, 2900);
    			add_location(th9, file$1, 101, 10, 2924);
    			add_location(th10, file$1, 102, 10, 2946);
    			add_location(th11, file$1, 103, 10, 2968);
    			add_location(th12, file$1, 104, 10, 2991);
    			add_location(th13, file$1, 105, 10, 3013);
    			add_location(th14, file$1, 106, 10, 3035);
    			add_location(tr, file$1, 91, 8, 2685);
    			attr_dev(table, "class", "w-full svelte-14b85j4");
    			add_location(table, file$1, 90, 6, 2654);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, small, anchor);
    			insert_dev(target, t1, anchor);
    			insert_dev(target, br0, anchor);
    			insert_dev(target, br1, anchor);
    			insert_dev(target, t2, anchor);
    			insert_dev(target, table, anchor);
    			append_dev(table, tr);
    			append_dev(tr, th0);
    			append_dev(tr, t4);
    			append_dev(tr, th1);
    			append_dev(tr, t6);
    			append_dev(tr, th2);
    			append_dev(tr, t8);
    			append_dev(tr, th3);
    			append_dev(tr, t10);
    			append_dev(tr, th4);
    			append_dev(tr, t12);
    			append_dev(tr, th5);
    			append_dev(tr, t14);
    			append_dev(tr, th6);
    			append_dev(tr, t16);
    			append_dev(tr, th7);
    			append_dev(tr, t18);
    			append_dev(tr, th8);
    			append_dev(tr, t20);
    			append_dev(tr, th9);
    			append_dev(tr, t22);
    			append_dev(tr, th10);
    			append_dev(tr, t24);
    			append_dev(tr, th11);
    			append_dev(tr, t26);
    			append_dev(tr, th12);
    			append_dev(tr, t28);
    			append_dev(tr, th13);
    			append_dev(tr, t30);
    			append_dev(tr, th14);
    			append_dev(table, t32);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(table, null);
    			}
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*matchDisplay, calcPlayerPosition, Date*/ 10) {
    				each_value = /*matchDisplay*/ ctx[1];
    				validate_each_argument(each_value);
    				let i;

    				for (i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    					} else {
    						each_blocks[i] = create_each_block(child_ctx);
    						each_blocks[i].c();
    						each_blocks[i].m(table, null);
    					}
    				}

    				for (; i < each_blocks.length; i += 1) {
    					each_blocks[i].d(1);
    				}

    				each_blocks.length = each_value.length;
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(small);
    			if (detaching) detach_dev(t1);
    			if (detaching) detach_dev(br0);
    			if (detaching) detach_dev(br1);
    			if (detaching) detach_dev(t2);
    			if (detaching) detach_dev(table);
    			destroy_each(each_blocks, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_1$1.name,
    		type: "if",
    		source: "(88:4) {#if matchDisplay.length > 0 && !matchDataLoading}",
    		ctx
    	});

    	return block;
    }

    // (112:40) {:else}
    function create_else_block(ctx) {
    	let t;

    	const block = {
    		c: function create() {
    			t = text("L");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, t, anchor);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(t);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_else_block.name,
    		type: "else",
    		source: "(112:40) {:else}",
    		ctx
    	});

    	return block;
    }

    // (112:16) {#if match.win === '1'}
    function create_if_block_2$1(ctx) {
    	let t;

    	const block = {
    		c: function create() {
    			t = text("W");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, t, anchor);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(t);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_2$1.name,
    		type: "if",
    		source: "(112:16) {#if match.win === '1'}",
    		ctx
    	});

    	return block;
    }

    // (109:8) {#each matchDisplay as match}
    function create_each_block(ctx) {
    	let tr;
    	let td0;
    	let t0_value = new Date(/*match*/ ctx[8].started_at * 1000).getDate() + "";
    	let t0;
    	let t1;
    	let t2_value = new Date(/*match*/ ctx[8].started_at * 1000).getMonth() + 1 + "";
    	let t2;
    	let t3;
    	let t4_value = new Date(/*match*/ ctx[8].started_at * 1000).getFullYear() + "";
    	let t4;
    	let t5;
    	let td1;
    	let t6;
    	let td2;
    	let t7_value = /*match*/ ctx[8].score + "";
    	let t7;
    	let t8;
    	let td3;
    	let t9_value = /*match*/ ctx[8].map + "";
    	let t9;
    	let t10;
    	let td4;
    	let t11_value = /*calcPlayerPosition*/ ctx[3](/*match*/ ctx[8].players) + "";
    	let t11;
    	let t12;
    	let td5;
    	let t13_value = /*match*/ ctx[8].player.player_stats.Kills + "";
    	let t13;
    	let t14;
    	let td6;
    	let t15_value = /*match*/ ctx[8].player.player_stats.Assists + "";
    	let t15;
    	let t16;
    	let td7;
    	let t17_value = /*match*/ ctx[8].player.player_stats.Deaths + "";
    	let t17;
    	let t18;
    	let td8;
    	let t19_value = /*match*/ ctx[8].player.player_stats["Headshots %"] + "";
    	let t19;
    	let t20;
    	let td9;
    	let t21_value = /*match*/ ctx[8].player.player_stats["K/D Ratio"] + "";
    	let t21;
    	let t22;
    	let td10;
    	let t23_value = /*match*/ ctx[8].player.player_stats["K/R Ratio"] + "";
    	let t23;
    	let t24;
    	let td11;
    	let t25_value = /*match*/ ctx[8].player.player_stats.MVPs + "";
    	let t25;
    	let t26;
    	let td12;
    	let t27_value = /*match*/ ctx[8].player.player_stats["Triple Kills"] + "";
    	let t27;
    	let t28;
    	let td13;
    	let t29_value = /*match*/ ctx[8].player.player_stats["Quadro Kills"] + "";
    	let t29;
    	let t30;
    	let td14;
    	let t31_value = /*match*/ ctx[8].player.player_stats["Penta Kills"] + "";
    	let t31;
    	let t32;

    	function select_block_type(ctx, dirty) {
    		if (/*match*/ ctx[8].win === "1") return create_if_block_2$1;
    		return create_else_block;
    	}

    	let current_block_type = select_block_type(ctx);
    	let if_block = current_block_type(ctx);

    	const block = {
    		c: function create() {
    			tr = element("tr");
    			td0 = element("td");
    			t0 = text(t0_value);
    			t1 = text("/");
    			t2 = text(t2_value);
    			t3 = text("/");
    			t4 = text(t4_value);
    			t5 = space();
    			td1 = element("td");
    			if_block.c();
    			t6 = space();
    			td2 = element("td");
    			t7 = text(t7_value);
    			t8 = space();
    			td3 = element("td");
    			t9 = text(t9_value);
    			t10 = space();
    			td4 = element("td");
    			t11 = text(t11_value);
    			t12 = space();
    			td5 = element("td");
    			t13 = text(t13_value);
    			t14 = space();
    			td6 = element("td");
    			t15 = text(t15_value);
    			t16 = space();
    			td7 = element("td");
    			t17 = text(t17_value);
    			t18 = space();
    			td8 = element("td");
    			t19 = text(t19_value);
    			t20 = space();
    			td9 = element("td");
    			t21 = text(t21_value);
    			t22 = space();
    			td10 = element("td");
    			t23 = text(t23_value);
    			t24 = space();
    			td11 = element("td");
    			t25 = text(t25_value);
    			t26 = space();
    			td12 = element("td");
    			t27 = text(t27_value);
    			t28 = space();
    			td13 = element("td");
    			t29 = text(t29_value);
    			t30 = space();
    			td14 = element("td");
    			t31 = text(t31_value);
    			t32 = space();
    			attr_dev(td0, "class", "svelte-14b85j4");
    			add_location(td0, file$1, 110, 12, 3126);
    			attr_dev(td1, "class", "svelte-14b85j4");
    			add_location(td1, file$1, 111, 12, 3294);
    			attr_dev(td2, "class", "svelte-14b85j4");
    			add_location(td2, file$1, 112, 12, 3353);
    			attr_dev(td3, "class", "svelte-14b85j4");
    			add_location(td3, file$1, 113, 12, 3388);
    			attr_dev(td4, "class", "svelte-14b85j4");
    			add_location(td4, file$1, 114, 12, 3421);
    			attr_dev(td5, "class", "svelte-14b85j4");
    			add_location(td5, file$1, 115, 12, 3478);
    			attr_dev(td6, "class", "svelte-14b85j4");
    			add_location(td6, file$1, 116, 12, 3533);
    			attr_dev(td7, "class", "svelte-14b85j4");
    			add_location(td7, file$1, 117, 12, 3590);
    			attr_dev(td8, "class", "svelte-14b85j4");
    			add_location(td8, file$1, 118, 12, 3646);
    			attr_dev(td9, "class", "svelte-14b85j4");
    			add_location(td9, file$1, 119, 12, 3710);
    			attr_dev(td10, "class", "svelte-14b85j4");
    			add_location(td10, file$1, 120, 12, 3772);
    			attr_dev(td11, "class", "svelte-14b85j4");
    			add_location(td11, file$1, 121, 12, 3834);
    			attr_dev(td12, "class", "svelte-14b85j4");
    			add_location(td12, file$1, 122, 12, 3888);
    			attr_dev(td13, "class", "svelte-14b85j4");
    			add_location(td13, file$1, 123, 12, 3953);
    			attr_dev(td14, "class", "svelte-14b85j4");
    			add_location(td14, file$1, 124, 12, 4018);
    			add_location(tr, file$1, 109, 10, 3109);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, tr, anchor);
    			append_dev(tr, td0);
    			append_dev(td0, t0);
    			append_dev(td0, t1);
    			append_dev(td0, t2);
    			append_dev(td0, t3);
    			append_dev(td0, t4);
    			append_dev(tr, t5);
    			append_dev(tr, td1);
    			if_block.m(td1, null);
    			append_dev(tr, t6);
    			append_dev(tr, td2);
    			append_dev(td2, t7);
    			append_dev(tr, t8);
    			append_dev(tr, td3);
    			append_dev(td3, t9);
    			append_dev(tr, t10);
    			append_dev(tr, td4);
    			append_dev(td4, t11);
    			append_dev(tr, t12);
    			append_dev(tr, td5);
    			append_dev(td5, t13);
    			append_dev(tr, t14);
    			append_dev(tr, td6);
    			append_dev(td6, t15);
    			append_dev(tr, t16);
    			append_dev(tr, td7);
    			append_dev(td7, t17);
    			append_dev(tr, t18);
    			append_dev(tr, td8);
    			append_dev(td8, t19);
    			append_dev(tr, t20);
    			append_dev(tr, td9);
    			append_dev(td9, t21);
    			append_dev(tr, t22);
    			append_dev(tr, td10);
    			append_dev(td10, t23);
    			append_dev(tr, t24);
    			append_dev(tr, td11);
    			append_dev(td11, t25);
    			append_dev(tr, t26);
    			append_dev(tr, td12);
    			append_dev(td12, t27);
    			append_dev(tr, t28);
    			append_dev(tr, td13);
    			append_dev(td13, t29);
    			append_dev(tr, t30);
    			append_dev(tr, td14);
    			append_dev(td14, t31);
    			append_dev(tr, t32);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*matchDisplay*/ 2 && t0_value !== (t0_value = new Date(/*match*/ ctx[8].started_at * 1000).getDate() + "")) set_data_dev(t0, t0_value);
    			if (dirty & /*matchDisplay*/ 2 && t2_value !== (t2_value = new Date(/*match*/ ctx[8].started_at * 1000).getMonth() + 1 + "")) set_data_dev(t2, t2_value);
    			if (dirty & /*matchDisplay*/ 2 && t4_value !== (t4_value = new Date(/*match*/ ctx[8].started_at * 1000).getFullYear() + "")) set_data_dev(t4, t4_value);

    			if (current_block_type !== (current_block_type = select_block_type(ctx))) {
    				if_block.d(1);
    				if_block = current_block_type(ctx);

    				if (if_block) {
    					if_block.c();
    					if_block.m(td1, null);
    				}
    			}

    			if (dirty & /*matchDisplay*/ 2 && t7_value !== (t7_value = /*match*/ ctx[8].score + "")) set_data_dev(t7, t7_value);
    			if (dirty & /*matchDisplay*/ 2 && t9_value !== (t9_value = /*match*/ ctx[8].map + "")) set_data_dev(t9, t9_value);
    			if (dirty & /*matchDisplay*/ 2 && t11_value !== (t11_value = /*calcPlayerPosition*/ ctx[3](/*match*/ ctx[8].players) + "")) set_data_dev(t11, t11_value);
    			if (dirty & /*matchDisplay*/ 2 && t13_value !== (t13_value = /*match*/ ctx[8].player.player_stats.Kills + "")) set_data_dev(t13, t13_value);
    			if (dirty & /*matchDisplay*/ 2 && t15_value !== (t15_value = /*match*/ ctx[8].player.player_stats.Assists + "")) set_data_dev(t15, t15_value);
    			if (dirty & /*matchDisplay*/ 2 && t17_value !== (t17_value = /*match*/ ctx[8].player.player_stats.Deaths + "")) set_data_dev(t17, t17_value);
    			if (dirty & /*matchDisplay*/ 2 && t19_value !== (t19_value = /*match*/ ctx[8].player.player_stats["Headshots %"] + "")) set_data_dev(t19, t19_value);
    			if (dirty & /*matchDisplay*/ 2 && t21_value !== (t21_value = /*match*/ ctx[8].player.player_stats["K/D Ratio"] + "")) set_data_dev(t21, t21_value);
    			if (dirty & /*matchDisplay*/ 2 && t23_value !== (t23_value = /*match*/ ctx[8].player.player_stats["K/R Ratio"] + "")) set_data_dev(t23, t23_value);
    			if (dirty & /*matchDisplay*/ 2 && t25_value !== (t25_value = /*match*/ ctx[8].player.player_stats.MVPs + "")) set_data_dev(t25, t25_value);
    			if (dirty & /*matchDisplay*/ 2 && t27_value !== (t27_value = /*match*/ ctx[8].player.player_stats["Triple Kills"] + "")) set_data_dev(t27, t27_value);
    			if (dirty & /*matchDisplay*/ 2 && t29_value !== (t29_value = /*match*/ ctx[8].player.player_stats["Quadro Kills"] + "")) set_data_dev(t29, t29_value);
    			if (dirty & /*matchDisplay*/ 2 && t31_value !== (t31_value = /*match*/ ctx[8].player.player_stats["Penta Kills"] + "")) set_data_dev(t31, t31_value);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(tr);
    			if_block.d();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block.name,
    		type: "each",
    		source: "(109:8) {#each matchDisplay as match}",
    		ctx
    	});

    	return block;
    }

    // (85:2) <ContentBox>
    function create_default_slot$1(ctx) {
    	let t;
    	let if_block1_anchor;
    	let if_block0 = /*matchDataLoading*/ ctx[0] && create_if_block_3$1(ctx);
    	let if_block1 = /*matchDisplay*/ ctx[1].length > 0 && !/*matchDataLoading*/ ctx[0] && create_if_block_1$1(ctx);

    	const block = {
    		c: function create() {
    			if (if_block0) if_block0.c();
    			t = space();
    			if (if_block1) if_block1.c();
    			if_block1_anchor = empty();
    		},
    		m: function mount(target, anchor) {
    			if (if_block0) if_block0.m(target, anchor);
    			insert_dev(target, t, anchor);
    			if (if_block1) if_block1.m(target, anchor);
    			insert_dev(target, if_block1_anchor, anchor);
    		},
    		p: function update(ctx, dirty) {
    			if (/*matchDataLoading*/ ctx[0]) {
    				if (if_block0) {
    					if_block0.p(ctx, dirty);
    				} else {
    					if_block0 = create_if_block_3$1(ctx);
    					if_block0.c();
    					if_block0.m(t.parentNode, t);
    				}
    			} else if (if_block0) {
    				if_block0.d(1);
    				if_block0 = null;
    			}

    			if (/*matchDisplay*/ ctx[1].length > 0 && !/*matchDataLoading*/ ctx[0]) {
    				if (if_block1) {
    					if_block1.p(ctx, dirty);
    				} else {
    					if_block1 = create_if_block_1$1(ctx);
    					if_block1.c();
    					if_block1.m(if_block1_anchor.parentNode, if_block1_anchor);
    				}
    			} else if (if_block1) {
    				if_block1.d(1);
    				if_block1 = null;
    			}
    		},
    		d: function destroy(detaching) {
    			if (if_block0) if_block0.d(detaching);
    			if (detaching) detach_dev(t);
    			if (if_block1) if_block1.d(detaching);
    			if (detaching) detach_dev(if_block1_anchor);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot$1.name,
    		type: "slot",
    		source: "(85:2) <ContentBox>",
    		ctx
    	});

    	return block;
    }

    function create_fragment$1(ctx) {
    	let fixedcontent;
    	let t0;
    	let br;
    	let t1;
    	let if_block_anchor;
    	let current;

    	fixedcontent = new FixedContent({
    			props: {
    				$$slots: { default: [create_default_slot_1$1] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	let if_block = (/*matchDataLoading*/ ctx[0] || /*matchDisplay*/ ctx[1].length > 0) && create_if_block$1(ctx);

    	const block = {
    		c: function create() {
    			create_component(fixedcontent.$$.fragment);
    			t0 = space();
    			br = element("br");
    			t1 = space();
    			if (if_block) if_block.c();
    			if_block_anchor = empty();
    			add_location(br, file$1, 81, 0, 2319);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			mount_component(fixedcontent, target, anchor);
    			insert_dev(target, t0, anchor);
    			insert_dev(target, br, anchor);
    			insert_dev(target, t1, anchor);
    			if (if_block) if_block.m(target, anchor);
    			insert_dev(target, if_block_anchor, anchor);
    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			const fixedcontent_changes = {};

    			if (dirty & /*$$scope*/ 2048) {
    				fixedcontent_changes.$$scope = { dirty, ctx };
    			}

    			fixedcontent.$set(fixedcontent_changes);

    			if (/*matchDataLoading*/ ctx[0] || /*matchDisplay*/ ctx[1].length > 0) {
    				if (if_block) {
    					if_block.p(ctx, dirty);

    					if (dirty & /*matchDataLoading, matchDisplay*/ 3) {
    						transition_in(if_block, 1);
    					}
    				} else {
    					if_block = create_if_block$1(ctx);
    					if_block.c();
    					transition_in(if_block, 1);
    					if_block.m(if_block_anchor.parentNode, if_block_anchor);
    				}
    			} else if (if_block) {
    				group_outros();

    				transition_out(if_block, 1, 1, () => {
    					if_block = null;
    				});

    				check_outros();
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(fixedcontent.$$.fragment, local);
    			transition_in(if_block);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(fixedcontent.$$.fragment, local);
    			transition_out(if_block);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(fixedcontent, detaching);
    			if (detaching) detach_dev(t0);
    			if (detaching) detach_dev(br);
    			if (detaching) detach_dev(t1);
    			if (if_block) if_block.d(detaching);
    			if (detaching) detach_dev(if_block_anchor);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$1.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$1($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("MatchData", slots, []);
    	let { playerId } = $$props;
    	let matchData = null;
    	let matchDataLoading = false;
    	let matchDisplay = [];

    	const getMatchStats = async matchId => {
    		const statsData = await getPlayerMatchStats(matchId);
    		console.log(statsData);
    		return statsData;
    	};

    	const getMatchHistory = async () => {
    		$$invalidate(0, matchDataLoading = true);
    		matchData = await getPlayerMatchHistory(playerId);
    		console.log(matchData);

    		// TODO for each match
    		for (let x = 0; x < matchData.length; x++) {
    			const singleMatch = await getMatchStats(matchData[x].match_id);

    			if (singleMatch && singleMatch.rounds) {
    				let team;

    				if (checkTeamForPlayer(singleMatch.rounds[0].teams[0])) {
    					team = singleMatch.rounds[0].teams[0];
    				} else if (checkTeamForPlayer(singleMatch.rounds[0].teams[1])) {
    					team = singleMatch.rounds[0].teams[1];
    				}

    				console.log(team);

    				if (team) {
    					const matchObj = {
    						started_at: matchData[x].started_at,
    						map: singleMatch.rounds[0].round_stats.Map,
    						score: singleMatch.rounds[0].round_stats.Score,
    						win: team.team_stats["Team Win"],
    						players: team.players,
    						player: team.players.find(el => el.player_id === playerId)
    					};

    					$$invalidate(1, matchDisplay = [...matchDisplay, matchObj]);
    					console.log(matchDisplay);
    				}
    			}
    		}

    		$$invalidate(0, matchDataLoading = false);
    	};

    	const checkTeamForPlayer = team => {
    		if (!team.players) return false;
    		return team.players.find(el => el.player_id === playerId);
    	};

    	const calcPlayerPosition = teamData => {
    		const sortedByKills = teamData.sort((a, b) => b.player_stats.Kills - a.player_stats.Kills);
    		return sortedByKills.map(el => el.player_id).indexOf(playerId) + 1;
    	};

    	getMatchHistory();
    	const writable_props = ["playerId"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console_1$1.warn(`<MatchData> was created with unknown prop '${key}'`);
    	});

    	$$self.$$set = $$props => {
    		if ("playerId" in $$props) $$invalidate(4, playerId = $$props.playerId);
    	};

    	$$self.$capture_state = () => ({
    		Button,
    		ContentBox,
    		FixedContent,
    		getPlayerMatchHistory,
    		getPlayerMatchStats,
    		playerId,
    		matchData,
    		matchDataLoading,
    		matchDisplay,
    		getMatchStats,
    		getMatchHistory,
    		checkTeamForPlayer,
    		calcPlayerPosition
    	});

    	$$self.$inject_state = $$props => {
    		if ("playerId" in $$props) $$invalidate(4, playerId = $$props.playerId);
    		if ("matchData" in $$props) matchData = $$props.matchData;
    		if ("matchDataLoading" in $$props) $$invalidate(0, matchDataLoading = $$props.matchDataLoading);
    		if ("matchDisplay" in $$props) $$invalidate(1, matchDisplay = $$props.matchDisplay);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [matchDataLoading, matchDisplay, getMatchHistory, calcPlayerPosition, playerId];
    }

    class MatchData extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$1, create_fragment$1, safe_not_equal, { playerId: 4 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "MatchData",
    			options,
    			id: create_fragment$1.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*playerId*/ ctx[4] === undefined && !("playerId" in props)) {
    			console_1$1.warn("<MatchData> was created without expected prop 'playerId'");
    		}
    	}

    	get playerId() {
    		throw new Error("<MatchData>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set playerId(value) {
    		throw new Error("<MatchData>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src/App.svelte generated by Svelte v3.37.0 */

    const { console: console_1 } = globals;
    const file = "src/App.svelte";

    // (29779:8) {#if playerDataLoading || playerData}
    function create_if_block_1(ctx) {
    	let contentbox;
    	let current;

    	contentbox = new ContentBox({
    			props: {
    				$$slots: { default: [create_default_slot_1] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			create_component(contentbox.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(contentbox, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const contentbox_changes = {};

    			if (dirty & /*$$scope, playerData, playerDataLoading*/ 38) {
    				contentbox_changes.$$scope = { dirty, ctx };
    			}

    			contentbox.$set(contentbox_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(contentbox.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(contentbox.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(contentbox, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_1.name,
    		type: "if",
    		source: "(29779:8) {#if playerDataLoading || playerData}",
    		ctx
    	});

    	return block;
    }

    // (29781:12) {#if playerDataLoading}
    function create_if_block_5(ctx) {
    	let t;

    	const block = {
    		c: function create() {
    			t = text("Loading...");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, t, anchor);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(t);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_5.name,
    		type: "if",
    		source: "(29781:12) {#if playerDataLoading}",
    		ctx
    	});

    	return block;
    }

    // (29784:33) 
    function create_if_block_3(ctx) {
    	let b;
    	let t1;
    	let t2_value = /*playerData*/ ctx[1].player_id + "";
    	let t2;
    	let t3;
    	let br;
    	let t4;
    	let if_block_anchor;
    	let if_block = /*playerData*/ ctx[1].games.csgo && create_if_block_4(ctx);

    	const block = {
    		c: function create() {
    			b = element("b");
    			b.textContent = "Player ID:";
    			t1 = space();
    			t2 = text(t2_value);
    			t3 = space();
    			br = element("br");
    			t4 = space();
    			if (if_block) if_block.c();
    			if_block_anchor = empty();
    			add_location(b, file, 29784, 14, 619421);
    			add_location(br, file, 29785, 14, 619476);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, b, anchor);
    			insert_dev(target, t1, anchor);
    			insert_dev(target, t2, anchor);
    			insert_dev(target, t3, anchor);
    			insert_dev(target, br, anchor);
    			insert_dev(target, t4, anchor);
    			if (if_block) if_block.m(target, anchor);
    			insert_dev(target, if_block_anchor, anchor);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*playerData*/ 2 && t2_value !== (t2_value = /*playerData*/ ctx[1].player_id + "")) set_data_dev(t2, t2_value);

    			if (/*playerData*/ ctx[1].games.csgo) {
    				if (if_block) {
    					if_block.p(ctx, dirty);
    				} else {
    					if_block = create_if_block_4(ctx);
    					if_block.c();
    					if_block.m(if_block_anchor.parentNode, if_block_anchor);
    				}
    			} else if (if_block) {
    				if_block.d(1);
    				if_block = null;
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(b);
    			if (detaching) detach_dev(t1);
    			if (detaching) detach_dev(t2);
    			if (detaching) detach_dev(t3);
    			if (detaching) detach_dev(br);
    			if (detaching) detach_dev(t4);
    			if (if_block) if_block.d(detaching);
    			if (detaching) detach_dev(if_block_anchor);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_3.name,
    		type: "if",
    		source: "(29784:33) ",
    		ctx
    	});

    	return block;
    }

    // (29782:12) {#if playerData && playerData.errors}
    function create_if_block_2(ctx) {
    	let t;

    	const block = {
    		c: function create() {
    			t = text("There's been an issue retrieving data for that nickname, please check it's correct.");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, t, anchor);
    		},
    		p: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(t);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_2.name,
    		type: "if",
    		source: "(29782:12) {#if playerData && playerData.errors}",
    		ctx
    	});

    	return block;
    }

    // (29787:14) {#if playerData.games.csgo}
    function create_if_block_4(ctx) {
    	let b0;
    	let t1;
    	let t2_value = /*playerData*/ ctx[1].games.csgo.faceit_elo + "";
    	let t2;
    	let t3;
    	let br;
    	let t4;
    	let b1;
    	let t6;
    	let t7_value = /*playerData*/ ctx[1].games.csgo.skill_level + "";
    	let t7;

    	const block = {
    		c: function create() {
    			b0 = element("b");
    			b0.textContent = "ELO:";
    			t1 = space();
    			t2 = text(t2_value);
    			t3 = space();
    			br = element("br");
    			t4 = space();
    			b1 = element("b");
    			b1.textContent = "Level:";
    			t6 = space();
    			t7 = text(t7_value);
    			add_location(b0, file, 29787, 16, 619541);
    			add_location(br, file, 29788, 16, 619604);
    			add_location(b1, file, 29789, 16, 619627);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, b0, anchor);
    			insert_dev(target, t1, anchor);
    			insert_dev(target, t2, anchor);
    			insert_dev(target, t3, anchor);
    			insert_dev(target, br, anchor);
    			insert_dev(target, t4, anchor);
    			insert_dev(target, b1, anchor);
    			insert_dev(target, t6, anchor);
    			insert_dev(target, t7, anchor);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*playerData*/ 2 && t2_value !== (t2_value = /*playerData*/ ctx[1].games.csgo.faceit_elo + "")) set_data_dev(t2, t2_value);
    			if (dirty & /*playerData*/ 2 && t7_value !== (t7_value = /*playerData*/ ctx[1].games.csgo.skill_level + "")) set_data_dev(t7, t7_value);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(b0);
    			if (detaching) detach_dev(t1);
    			if (detaching) detach_dev(t2);
    			if (detaching) detach_dev(t3);
    			if (detaching) detach_dev(br);
    			if (detaching) detach_dev(t4);
    			if (detaching) detach_dev(b1);
    			if (detaching) detach_dev(t6);
    			if (detaching) detach_dev(t7);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_4.name,
    		type: "if",
    		source: "(29787:14) {#if playerData.games.csgo}",
    		ctx
    	});

    	return block;
    }

    // (29780:10) <ContentBox>
    function create_default_slot_1(ctx) {
    	let t;
    	let if_block1_anchor;
    	let if_block0 = /*playerDataLoading*/ ctx[2] && create_if_block_5(ctx);

    	function select_block_type(ctx, dirty) {
    		if (/*playerData*/ ctx[1] && /*playerData*/ ctx[1].errors) return create_if_block_2;
    		if (/*playerData*/ ctx[1]) return create_if_block_3;
    	}

    	let current_block_type = select_block_type(ctx);
    	let if_block1 = current_block_type && current_block_type(ctx);

    	const block = {
    		c: function create() {
    			if (if_block0) if_block0.c();
    			t = space();
    			if (if_block1) if_block1.c();
    			if_block1_anchor = empty();
    		},
    		m: function mount(target, anchor) {
    			if (if_block0) if_block0.m(target, anchor);
    			insert_dev(target, t, anchor);
    			if (if_block1) if_block1.m(target, anchor);
    			insert_dev(target, if_block1_anchor, anchor);
    		},
    		p: function update(ctx, dirty) {
    			if (/*playerDataLoading*/ ctx[2]) {
    				if (if_block0) ; else {
    					if_block0 = create_if_block_5(ctx);
    					if_block0.c();
    					if_block0.m(t.parentNode, t);
    				}
    			} else if (if_block0) {
    				if_block0.d(1);
    				if_block0 = null;
    			}

    			if (current_block_type === (current_block_type = select_block_type(ctx)) && if_block1) {
    				if_block1.p(ctx, dirty);
    			} else {
    				if (if_block1) if_block1.d(1);
    				if_block1 = current_block_type && current_block_type(ctx);

    				if (if_block1) {
    					if_block1.c();
    					if_block1.m(if_block1_anchor.parentNode, if_block1_anchor);
    				}
    			}
    		},
    		d: function destroy(detaching) {
    			if (if_block0) if_block0.d(detaching);
    			if (detaching) detach_dev(t);

    			if (if_block1) {
    				if_block1.d(detaching);
    			}

    			if (detaching) detach_dev(if_block1_anchor);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot_1.name,
    		type: "slot",
    		source: "(29780:10) <ContentBox>",
    		ctx
    	});

    	return block;
    }

    // (29765:2) <FixedContent>
    function create_default_slot(ctx) {
    	let div4;
    	let div2;
    	let div0;
    	let label;
    	let t1;
    	let input;
    	let t2;
    	let div1;
    	let button;
    	let t3;
    	let div3;
    	let current;
    	let mounted;
    	let dispose;

    	button = new Button({
    			props: {
    				text: "Get profile data",
    				onClick: /*getProfileData*/ ctx[3]
    			},
    			$$inline: true
    		});

    	let if_block = (/*playerDataLoading*/ ctx[2] || /*playerData*/ ctx[1]) && create_if_block_1(ctx);

    	const block = {
    		c: function create() {
    			div4 = element("div");
    			div2 = element("div");
    			div0 = element("div");
    			label = element("label");
    			label.textContent = "FaceIT Nickname";
    			t1 = space();
    			input = element("input");
    			t2 = space();
    			div1 = element("div");
    			create_component(button.$$.fragment);
    			t3 = space();
    			div3 = element("div");
    			if (if_block) if_block.c();
    			attr_dev(label, "class", "mr-2");
    			add_location(label, file, 29768, 10, 618832);
    			attr_dev(input, "type", "text");
    			add_location(input, file, 29769, 10, 618886);
    			attr_dev(div0, "class", "flex");
    			add_location(div0, file, 29767, 8, 618803);
    			attr_dev(div1, "class", "my-2");
    			add_location(div1, file, 29772, 8, 618954);
    			attr_dev(div2, "class", "flex-none");
    			add_location(div2, file, 29766, 6, 618771);
    			attr_dev(div3, "class", "flex-1  ml-4");
    			add_location(div3, file, 29777, 6, 619078);
    			attr_dev(div4, "class", "flex");
    			add_location(div4, file, 29765, 4, 618746);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div4, anchor);
    			append_dev(div4, div2);
    			append_dev(div2, div0);
    			append_dev(div0, label);
    			append_dev(div0, t1);
    			append_dev(div0, input);
    			set_input_value(input, /*nickname*/ ctx[0]);
    			append_dev(div2, t2);
    			append_dev(div2, div1);
    			mount_component(button, div1, null);
    			append_dev(div4, t3);
    			append_dev(div4, div3);
    			if (if_block) if_block.m(div3, null);
    			current = true;

    			if (!mounted) {
    				dispose = listen_dev(input, "input", /*input_input_handler*/ ctx[4]);
    				mounted = true;
    			}
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*nickname*/ 1 && input.value !== /*nickname*/ ctx[0]) {
    				set_input_value(input, /*nickname*/ ctx[0]);
    			}

    			if (/*playerDataLoading*/ ctx[2] || /*playerData*/ ctx[1]) {
    				if (if_block) {
    					if_block.p(ctx, dirty);

    					if (dirty & /*playerDataLoading, playerData*/ 6) {
    						transition_in(if_block, 1);
    					}
    				} else {
    					if_block = create_if_block_1(ctx);
    					if_block.c();
    					transition_in(if_block, 1);
    					if_block.m(div3, null);
    				}
    			} else if (if_block) {
    				group_outros();

    				transition_out(if_block, 1, 1, () => {
    					if_block = null;
    				});

    				check_outros();
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(button.$$.fragment, local);
    			transition_in(if_block);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(button.$$.fragment, local);
    			transition_out(if_block);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div4);
    			destroy_component(button);
    			if (if_block) if_block.d();
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot.name,
    		type: "slot",
    		source: "(29765:2) <FixedContent>",
    		ctx
    	});

    	return block;
    }

    // (29800:2) {#if playerData && playerData.player_id}
    function create_if_block(ctx) {
    	let br;
    	let t;
    	let matchdata;
    	let current;

    	matchdata = new MatchData({
    			props: {
    				playerId: /*playerData*/ ctx[1].player_id
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			br = element("br");
    			t = space();
    			create_component(matchdata.$$.fragment);
    			add_location(br, file, 29800, 4, 619866);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, br, anchor);
    			insert_dev(target, t, anchor);
    			mount_component(matchdata, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const matchdata_changes = {};
    			if (dirty & /*playerData*/ 2) matchdata_changes.playerId = /*playerData*/ ctx[1].player_id;
    			matchdata.$set(matchdata_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(matchdata.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(matchdata.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(br);
    			if (detaching) detach_dev(t);
    			destroy_component(matchdata, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block.name,
    		type: "if",
    		source: "(29800:2) {#if playerData && playerData.player_id}",
    		ctx
    	});

    	return block;
    }

    function create_fragment(ctx) {
    	let div;
    	let h1;
    	let t1;
    	let fixedcontent;
    	let t2;
    	let current;

    	fixedcontent = new FixedContent({
    			props: {
    				$$slots: { default: [create_default_slot] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	let if_block = /*playerData*/ ctx[1] && /*playerData*/ ctx[1].player_id && create_if_block(ctx);

    	const block = {
    		c: function create() {
    			div = element("div");
    			h1 = element("h1");
    			h1.textContent = "FaceIT CS:GO Advanced Player Stats";
    			t1 = space();
    			create_component(fixedcontent.$$.fragment);
    			t2 = space();
    			if (if_block) if_block.c();
    			attr_dev(h1, "class", "mb-6  text-center");
    			add_location(h1, file, 29759, 2, 618613);
    			attr_dev(div, "class", "py-6");
    			add_location(div, file, 29757, 0, 618591);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, h1);
    			append_dev(div, t1);
    			mount_component(fixedcontent, div, null);
    			append_dev(div, t2);
    			if (if_block) if_block.m(div, null);
    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			const fixedcontent_changes = {};

    			if (dirty & /*$$scope, playerData, playerDataLoading, nickname*/ 39) {
    				fixedcontent_changes.$$scope = { dirty, ctx };
    			}

    			fixedcontent.$set(fixedcontent_changes);

    			if (/*playerData*/ ctx[1] && /*playerData*/ ctx[1].player_id) {
    				if (if_block) {
    					if_block.p(ctx, dirty);

    					if (dirty & /*playerData*/ 2) {
    						transition_in(if_block, 1);
    					}
    				} else {
    					if_block = create_if_block(ctx);
    					if_block.c();
    					transition_in(if_block, 1);
    					if_block.m(div, null);
    				}
    			} else if (if_block) {
    				group_outros();

    				transition_out(if_block, 1, 1, () => {
    					if_block = null;
    				});

    				check_outros();
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(fixedcontent.$$.fragment, local);
    			transition_in(if_block);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(fixedcontent.$$.fragment, local);
    			transition_out(if_block);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			destroy_component(fixedcontent);
    			if (if_block) if_block.d();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("App", slots, []);
    	let nickname = "th3t0m";
    	let playerData = null;
    	let playerDataLoading = false;

    	const getProfileData = async () => {
    		$$invalidate(2, playerDataLoading = true);
    		$$invalidate(1, playerData = null);
    		$$invalidate(1, playerData = await getPlayerInfo(nickname));
    		console.log(playerData);
    		$$invalidate(2, playerDataLoading = false);
    	};

    	getProfileData();
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console_1.warn(`<App> was created with unknown prop '${key}'`);
    	});

    	function input_input_handler() {
    		nickname = this.value;
    		$$invalidate(0, nickname);
    	}

    	$$self.$capture_state = () => ({
    		Button,
    		ContentBox,
    		FixedContent,
    		MatchData,
    		getPlayerInfo,
    		nickname,
    		playerData,
    		playerDataLoading,
    		getProfileData
    	});

    	$$self.$inject_state = $$props => {
    		if ("nickname" in $$props) $$invalidate(0, nickname = $$props.nickname);
    		if ("playerData" in $$props) $$invalidate(1, playerData = $$props.playerData);
    		if ("playerDataLoading" in $$props) $$invalidate(2, playerDataLoading = $$props.playerDataLoading);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [nickname, playerData, playerDataLoading, getProfileData, input_input_handler];
    }

    class App extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance, create_fragment, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "App",
    			options,
    			id: create_fragment.name
    		});
    	}
    }

    var app = new App({
    	target: document.body
    });

    return app;

}());
//# sourceMappingURL=bundle.js.map

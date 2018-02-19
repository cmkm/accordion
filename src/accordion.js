'use strict';

var extend = require('./util').extend;
var defaultOpts = {
    collapseOthers: false,
    customHiding: false,
    customTargets: false,
    contentPrefix: 'accordion',
    openFirst: false,
    reflectStatic: false,
    flatSearch: false
};

var defaultSelectors = {
    trigger: 'button'
};

/**
 * Creates a new accordion component
 * @constructor
 * @param {Element} elm - The element that contains the entire accordion
 * @param {object} selectors - Selectors for locating DOM elements
 * @param {object} opts - Options for configuring behavior
 */

var Accordion = function (elm, selectors, opts) {
    this.elm = elm;
    this.selectors = extend({}, defaultSelectors, selectors);
    this.opts = extend({}, defaultOpts, opts);

    this.triggers = this.findTriggers();

    this.listeners = [];
    this.addEventListener(this.elm, 'click', this.handleClickElm.bind(this));

    if (this.opts.openFirst) {
        this.expand(this.triggers[0]);
    }
};

Accordion.prototype.handleClickElm = function (e) {
    // If the target is the button, toggle the button
    // Else see if the target is a child of a button
    if ((this.triggers.indexOf(e.target) > -1)) {
        this.toggle(e.target);
    } else {
        var self = this;
        var ignored = {
            'A': true,
            'BUTTON': true
        }[e.target.tagName];
        this.triggers.forEach(function (trigger) {
            if (trigger.contains(e.target) && !ignored && (!e.target.hasAttribute('aria-controls'))) {
                self.toggle(trigger);
            }
        });
    }
};

Accordion.prototype.findTriggers = function () {
    var self = this;
    var triggers = [].slice.call(this.elm.querySelectorAll(this.selectors.trigger));
    triggers.forEach(function (trigger, index) {
        // support nested accordions, only use direct children triggers
        if (self.opts.flatSearch) {
            if (trigger.parentNode === self.elm) {
                self.setAria(trigger, index);
            } else {
                triggers.pop(index);
            }
        } else {
            self.setAria(trigger, index);
        }
    });
    return triggers;
};

Accordion.prototype.setAria = function (trigger, index) {
    var contentID;
    var content;

    if (this.opts.customTargets && trigger.hasAttribute('aria-controls')) {
        contentID = trigger.getAttribute('aria-controls');
        content = document.getElementById(contentID);
    } else {
        content = trigger.nextElementSibling;
    }

    var initExpanded = 'false';
    var initHidden = 'true';

    if (content.hasAttribute('id')) {
        contentID = content.getAttribute('id');
    } else {
        contentID = this.opts.contentPrefix + '-' + 'content-' + index;
        content.setAttribute('id', contentID);
    }

    if (this.opts.reflectStatic) {
        initExpanded = trigger.getAttribute('aria-expanded') || initExpanded;
        initHidden = content.getAttribute('aria-hidden') || initHidden;
    }

    trigger.setAttribute('aria-controls', contentID);
    trigger.setAttribute('aria-expanded', initExpanded);
    content.setAttribute('aria-hidden', initHidden);
    this.setStyles(content);
};

Accordion.prototype.toggle = function (elm) {
    var f = elm.getAttribute('aria-expanded') === 'true' ? this.collapse : this.expand;
    f.call(this, elm);
};

Accordion.prototype.expand = function (button) {
    if (this.opts.collapseOthers) {
        this.collapseAll();
    }
    var content = document.getElementById(button.getAttribute('aria-controls'));
    button.setAttribute('aria-expanded', 'true');
    content.setAttribute('aria-hidden', 'false');
    this.setStyles(content);
};

Accordion.prototype.collapse = function (button) {
    var content = document.getElementById(button.getAttribute('aria-controls'));
    button.setAttribute('aria-expanded', 'false');
    content.setAttribute('aria-hidden', 'true');
    this.setStyles(content);
};

Accordion.prototype.collapseAll = function () {
    var self = this;
    this.triggers.forEach(function (trigger) {
        self.collapse(trigger);
    });
};

Accordion.prototype.expandAll = function () {
    var self = this;
    this.triggers.forEach(function (trigger) {
        self.expand(trigger);
    });
};

Accordion.prototype.setStyles = function (content) {
    var prop = content.getAttribute('aria-hidden') === 'true' ? 'none' : 'block';

    if (!this.opts.customHiding) {
        content.style.display = prop;
    }
};

Accordion.prototype.addEventListener = function (elm, event, callback) {
    var self = this;

    if (elm) {
        elm.addEventListener(event, callback);

        self.listeners.push({
            elm: elm,
            event: event,
            callback: callback
        });
    }
};

Accordion.prototype.destroy = function () {
    this.listeners.forEach(function (listener) {
        listener.elm.removeEventListener(listener.event, listener.callback);
    });
};

module.exports = {Accordion: Accordion};

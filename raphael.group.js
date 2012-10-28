Raphael.fn.group = function () {

    var r = this,
    cfg = (arguments[0] instanceof Array) ? {} : arguments[0],
    items = (arguments[0] instanceof Array) ? arguments[0] : arguments[1];

    function Group(cfg, items) {
        var inst,
        set = r.set(items),
        matrix = r.raphael.matrix(),
        blankets = [], //used for animations
        group = r.raphael.vml ? document.createElement("group") :
                                document.createElementNS("http://www.w3.org/2000/svg", "g");

        r.canvas.appendChild(group);

        function applyTransform(matrix, group) {
            group.setAttribute('transform', 'matrix(' +
                    matrix.a + ',' +
                    matrix.b + ',' +
                    matrix.c + ',' +
                    matrix.d + ',' +
                    matrix.e + ',' +
                    matrix.f +
                    ')'
                );
        }

        function copyTransform(m) {
            matrix.a = m.a;
            matrix.b = m.b;
            matrix.c = m.c;
            matrix.d = m.d;
            matrix.e = m.e;
            matrix.f = m.f;
        }

        inst = {
            scale: function (newScale) {
                matrix.scale(newScale);
                applyTransform(matrix, group);
                return this;
            },
            rotate: function (deg) {
                matrix.rotate(deg);
                applyTransform(matrix, group);
                return this;
            },
            translate: function (x, y) {
                matrix.translate(x, y);
                applyTransform(matrix, group);
                return this;
            },
            transform: function (m) {
                copyTransform(m);
                applyTransform(matrix, group);
                return this;
            },
            push: function (it) {
                group.appendChild(it.node);
                set.push(it);
                return this;
            },
            remove: function () {
                group.parentNode.removeChild(group);
                return this;
            },
            clear: function () {
                while (group.lastChild) {
                    group.removeChild(group.lastChild);
                }
                return this;
            },
            getBBox: function () {
                return set.getBBox();
            },
            animate: function (params, ms, easing, callback) {


                /* 
                Animation works by creating a hidden rectangle with the same 
                initial transform as the group.

                The hidden rect is then animated and its matrix is copied to the 
                group on every frame. 
                */
                var anim = arguments.length === 1 ? params : Raphael.animation(params, ms, easing, callback);

                //Create and position the rect
                var blanket = r.rect(0, 0, 100, 100).hide();
                blanket.transform(matrix.toTransformString());
                blanket.attr('opacity', this.opacity());

                //Set up the animation callback
                var self = this;
                var times = 0;

                //Called on each frame
                var frameCallback = function (obj) {
                    if (obj.anim[obj.top].transform) {
                        self.transform(blanket.matrix);
                    }
                    if (obj.anim[obj.top].opacity != null) {
                        self.opacity(blanket.attr('opacity'));
                    }
                };

                //Called when stop() method is called and from within the finish callback
                //Raphael does not call the users callback function when the animation is
                //stopped by calling stop().  That is why the callback is triggered in finishCallback()
                var stopCallback = function (obj) {
                    frameCallback(obj);
                    if (blanket) {
                        eve.off('raphael.anim.frame.' + blanket.id, frameCallback);
                        eve.off('raphael.anim.stop.' + blanket.id, stopCallback);
                        eve.off('raphael.anim.finish.' + blanket.id, finishCallback);
                        blanket.remove();
                        for (var i = 0; i < blankets.length; i++) {
                            if (blankets[i].animation === obj) {
                                blankets.splice(i, 1);
                                break;
                            }
                        }
                        blanket = null;
                    }
                }

                //Called when the animation (or each loop of) is finished.
                //Note this does not get called when you stop an animation.
                var finishCallback = function (obj) {
                    times++
                    if (obj.times !== 'Infinity' && obj.times === times) {
                        stopCallback(obj);
                    }
                }

                eve.on('raphael.anim.frame.' + blanket.id, frameCallback);
                eve.on('raphael.anim.stop.' + blanket.id, stopCallback);
                eve.on('raphael.anim.finish.' + blanket.id, finishCallback);

                blankets.push({ element: blanket, animation: anim });
                return blanket.animate(anim);
            },
            stop: function (anim) {
                if (blankets) {
                    if (!anim) {
                        while (blankets.length > 0) {
                            var b = blankets.pop();
                            b.element.stop();
                        }
                    }
                    else {
                        for (var i = 0; i < blankets.length; i++) {
                            if (blankets[i].animation === anim) {
                                blankets[i].element.stop(anim);
                                blankets.splice(i, 1);
                                break;
                            }
                        }
                    }
                }
            },
            pause: function () {
                if (blankets) {
                    blankets.forEach(function (b) { b.element.pause(); });
                }
            },
            resume: function () {
                if (blankets) {
                    blankets.forEach(function (b) { b.element.resume(); });
                }
            },
            opacity: function (value) {
                if (value == null) {
                    return group.getAttribute('opacity');
                } else {
                    group.setAttribute('opacity', value);
                }
            },
            type: 'group',
            node: group,
            matrix: matrix
        };

        return inst;
    }

    return Group(cfg, items);

};
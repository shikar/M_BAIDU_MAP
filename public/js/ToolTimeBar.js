/**
 * @namespace BMap 的所有 library 类均放在 BMapLib 命名空间下
 */
var BMapLib = window.BMapLib = BMapLib || {};
(function() {
  /**
   * 声明baidu包
   */
  var baidu = baidu || {guid : "$BAIDU$"};
  (function () {
    // 一些页面级别唯一的属性，需要挂载在window[baidu.guid]上
    window[baidu.guid] = {};

    /**
     * 将源对象的所有属性拷贝到目标对象中
     * @name baidu.extend
     * @function
     * @grammar baidu.extend(target, source)
     * @param {Object} target 目标对象
     * @param {Object} source 源对象
     * @returns {Object} 目标对象
     */
    baidu.extend = function (target, source) {
        for (var p in source) {
            if (source.hasOwnProperty(p)) {
                target[p] = source[p];
            }
        }
        return target;
    };

    /**
     * @ignore
     * @namespace
     * @baidu.lang 对语言层面的封装，包括类型判断、模块扩展、继承基类以及对象自定义事件的支持。
     * @property guid 对象的唯一标识
     */
    baidu.lang = baidu.lang || {};

    /**
     * 返回一个当前页面的唯一标识字符串。
     * @function
     * @grammar baidu.lang.guid()
     * @returns {String} 当前页面的唯一标识字符串
     */
    baidu.lang.guid = function () {
        return "TANGRAM__" + (window[baidu.guid]._counter++).toString(36);
    };

    window[baidu.guid]._counter = window[baidu.guid]._counter || 1;

    /**
     * 所有类的实例的容器
     * key为每个实例的guid
     */
    window[baidu.guid]._instances = window[baidu.guid]._instances || {};

    /**
     * Tangram继承机制提供的一个基类，用户可以通过继承baidu.lang.Class来获取它的属性及方法。
     * @function
     * @name baidu.lang.Class
     * @grammar baidu.lang.Class(guid)
     * @param {string} guid 对象的唯一标识
     * @meta standard
     * @remark baidu.lang.Class和它的子类的实例均包含一个全局唯一的标识guid。
     * guid是在构造函数中生成的，因此，继承自baidu.lang.Class的类应该直接或者间接调用它的构造函数。<br>
     * baidu.lang.Class的构造函数中产生guid的方式可以保证guid的唯一性，及每个实例都有一个全局唯一的guid。
     */
    baidu.lang.Class = function (guid) {
        this.guid = guid || baidu.lang.guid();
        window[baidu.guid]._instances[this.guid] = this;
    };

    window[baidu.guid]._instances = window[baidu.guid]._instances || {};

    /**
     * 判断目标参数是否string类型或String对象
     * @name baidu.lang.isString
     * @function
     * @grammar baidu.lang.isString(source)
     * @param {Any} source 目标参数
     * @shortcut isString
     * @meta standard
     *
     * @returns {boolean} 类型判断结果
     */
    baidu.lang.isString = function (source) {
        return '[object String]' == Object.prototype.toString.call(source);
    };
    baidu.isString = baidu.lang.isString;

    /**
     * 判断目标参数是否为function或Function实例
     * @name baidu.lang.isFunction
     * @function
     * @grammar baidu.lang.isFunction(source)
     * @param {Any} source 目标参数
     * @returns {boolean} 类型判断结果
     */
    baidu.lang.isFunction = function (source) {
        return '[object Function]' == Object.prototype.toString.call(source);
    };

    /**
     * 自定义的事件对象。
     * @function
     * @name baidu.lang.Event
     * @grammar baidu.lang.Event(type[, target])
     * @param {string} type  事件类型名称。为了方便区分事件和一个普通的方法，事件类型名称必须以"on"(小写)开头。
     * @param {Object} [target]触发事件的对象
     * @meta standard
     * @remark 引入该模块，会自动为Class引入3个事件扩展方法：addEventListener、removeEventListener和dispatchEvent。
     * @see baidu.lang.Class
     */
    baidu.lang.Event = function (type, target) {
        this.type = type;
        this.returnValue = true;
        this.target = target || null;
        this.currentTarget = null;
    };

    /**
     * 注册对象的事件监听器。引入baidu.lang.Event后，Class的子类实例才会获得该方法。
     * @grammar obj.addEventListener(type, handler[, key])
     * @param   {string}   type         自定义事件的名称
     * @param   {Function} handler      自定义事件被触发时应该调用的回调函数
     * @param   {string}   [key]    为事件监听函数指定的名称，可在移除时使用。如果不提供，方法会默认为它生成一个全局唯一的key。
     * @remark  事件类型区分大小写。如果自定义事件名称不是以小写"on"开头，该方法会给它加上"on"再进行判断，即"click"和"onclick"会被认为是同一种事件。
     */
    baidu.lang.Class.prototype.addEventListener = function (type, handler, key) {
        if (!baidu.lang.isFunction(handler)) {
            return;
        }!this.__listeners && (this.__listeners = {});
        var t = this.__listeners,
            id;
        if (typeof key == "string" && key) {
            if (/[^\w\-]/.test(key)) {
                throw ("nonstandard key:" + key);
            } else {
                handler.hashCode = key;
                id = key;
            }
        }
        type.indexOf("on") != 0 && (type = "on" + type);
        typeof t[type] != "object" && (t[type] = {});
        id = id || baidu.lang.guid();
        handler.hashCode = id;
        t[type][id] = handler;
    };

    /**
     * 移除对象的事件监听器。引入baidu.lang.Event后，Class的子类实例才会获得该方法。
     * @grammar obj.removeEventListener(type, handler)
     * @param {string}   type     事件类型
     * @param {Function|string} handler  要移除的事件监听函数或者监听函数的key
     * @remark  如果第二个参数handler没有被绑定到对应的自定义事件中，什么也不做。
     */
    baidu.lang.Class.prototype.removeEventListener = function (type, handler) {
        if (baidu.lang.isFunction(handler)) {
            handler = handler.hashCode;
        } else if (!baidu.lang.isString(handler)) {
            return;
        }!this.__listeners && (this.__listeners = {});
        type.indexOf("on") != 0 && (type = "on" + type);
        var t = this.__listeners;
        if (!t[type]) {
            return;
        }
        t[type][handler] && delete t[type][handler];
    };

    /**
     * 派发自定义事件，使得绑定到自定义事件上面的函数都会被执行。引入baidu.lang.Event后，Class的子类实例才会获得该方法。
     * @grammar obj.dispatchEvent(event, options)
     * @param {baidu.lang.Event|String} event   Event对象，或事件名称(1.1.1起支持)
     * @param {Object} options 扩展参数,所含属性键值会扩展到Event对象上(1.2起支持)
     * @remark 处理会调用通过addEventListenr绑定的自定义事件回调函数之外，还会调用直接绑定到对象上面的自定义事件。
     * 例如：<br>
     * myobj.onMyEvent = function(){}<br>
     * myobj.addEventListener("onMyEvent", function(){});
     */
    baidu.lang.Class.prototype.dispatchEvent = function (event, options) {
        if (baidu.lang.isString(event)) {
            event = new baidu.lang.Event(event);
        }!this.__listeners && (this.__listeners = {});
        options = options || {};
        for (var i in options) {
            event[i] = options[i];
        }
        var i, t = this.__listeners,
            p = event.type;
        event.target = event.target || this;
        event.currentTarget = this;
        p.indexOf("on") != 0 && (p = "on" + p);
        baidu.lang.isFunction(this[p]) && this[p].apply(this, arguments);
        if (typeof t[p] == "object") {
            for (i in t[p]) {
                t[p][i].apply(this, arguments);
            }
        }
        return event.returnValue;
    };

    /**
     * @ignore
     * @namespace baidu.dom
     * 操作dom的方法
     */
    baidu.dom = baidu.dom || {};

    /**
     * 从文档中获取指定的DOM元素
     * **内部方法**
     *
     * @param {string|HTMLElement} id 元素的id或DOM元素
     * @meta standard
     * @return {HTMLElement} DOM元素，如果不存在，返回null，如果参数不合法，直接返回参数
     */
    baidu.dom._g = function (id) {
        if (baidu.lang.isString(id)) {
            return document.getElementById(id);
        }
        return id;
    };
    baidu._g = baidu.dom._g;

    /**
     * @ignore
     * @namespace baidu.event 屏蔽浏览器差异性的事件封装。
     * @property target   事件的触发元素
     * @property pageX    鼠标事件的鼠标x坐标
     * @property pageY    鼠标事件的鼠标y坐标
     * @property keyCode  键盘事件的键值
     */
    baidu.event = baidu.event || {};

    /**
     * 事件监听器的存储表
     * @private
     * @meta standard
     */
    baidu.event._listeners = baidu.event._listeners || [];

    /**
     * 为目标元素添加事件监听器
     * @name baidu.event.on
     * @function
     * @grammar baidu.event.on(element, type, listener)
     * @param {HTMLElement|string|window} element 目标元素或目标元素id
     * @param {string} type 事件类型
     * @param {Function} listener 需要添加的监听器
     * @remark
     *
    1. 不支持跨浏览器的鼠标滚轮事件监听器添加<br>
    2. 改方法不为监听器灌入事件对象，以防止跨iframe事件挂载的事件对象获取失败

     * @shortcut on
     * @meta standard
     * @see baidu.event.un
     * @returns {HTMLElement|window} 目标元素
     */
    baidu.event.on = function (element, type, listener) {
        type = type.replace(/^on/i, '');
        element = baidu.dom._g(element);

        var realListener = function (ev) {
                listener.call(element, ev);
            },
            lis = baidu.event._listeners,
            filter = baidu.event._eventFilter,
            afterFilter, realType = type;
        type = type.toLowerCase();
        if (filter && filter[type]) {
            afterFilter = filter[type](element, type, realListener);
            realType = afterFilter.type;
            realListener = afterFilter.listener;
        }
        if (element.addEventListener) {
            element.addEventListener(realType, realListener, false);
        } else if (element.attachEvent) {
            element.attachEvent('on' + realType, realListener);
        }
        lis[lis.length] = [element, type, listener, realListener, realType];
        return element;
    };
    baidu.on = baidu.event.on;

    /**
     * 为目标元素移除事件监听器
     * @name baidu.event.un
     * @function
     * @grammar baidu.event.un(element, type, listener)
     * @param {HTMLElement|string|window} element 目标元素或目标元素id
     * @param {string} type 事件类型
     * @param {Function} listener 需要移除的监听器
     * @shortcut un
     * @meta standard
     * @see baidu.event.on
     *
     * @returns {HTMLElement|window} 目标元素
     */
    baidu.event.un = function (element, type, listener) {
        element = baidu.dom._g(element);
        type = type.replace(/^on/i, '').toLowerCase();

        var lis = baidu.event._listeners,
            len = lis.length,
            isRemoveAll = !listener,
            item, realType, realListener;
        while (len--) {
            item = lis[len];
            if (item[1] === type && item[0] === element && (isRemoveAll || item[2] === listener)) {
                realType = item[4];
                realListener = item[3];
                if (element.removeEventListener) {
                    element.removeEventListener(realType, realListener, false);
                } else if (element.detachEvent) {
                    element.detachEvent('on' + realType, realListener);
                }
                lis.splice(len, 1);
            }
        }

        return element;
    };
    baidu.un = baidu.event.un;

    /**
     * 阻止事件的默认行为
     * @name baidu.event.preventDefault
     * @function
     * @grammar baidu.event.preventDefault(event)
     * @param {Event} event 事件对象
     * @meta standard
     */
    baidu.preventDefault = baidu.event.preventDefault = function (event) {
        if (event.preventDefault) {
            event.preventDefault();
        } else {
            event.returnValue = false;
        }
    };
  })();

  /**
   * @exports ToolTimeBar as BMapLib.ToolTimeBar
   */
  var ToolTimeBar =
  /**
   * ToolTimeBar类的构造函数
   * @class 富Marker定义类，实现丰富的Marker展现效果。
   *
   * @constructor
   * @param {String | HTMLElement} content 用户自定义的Marker内容，可以是字符串，也可以是dom节点
   * @param {BMap.Point} position marker的位置
   * @param {Json} ToolTimeBarOptions 可选的输入参数，非必填项。可输入选项包括：<br />
   * {"<b>anchor</b>" : {BMap.Size} Marker的的位置偏移值,
   * <br />"<b>enableDragging</b>" : {Boolean} 是否启用拖拽，默认为false}
   *
   * @example <b>参考示例：</b>
   * var map = new BMap.Map("container");
   * map.centerAndZoom(new BMap.Point(116.309965, 40.058333), 17);
   * var htm = "&lt;div style='background:#E7F0F5;color:#0082CB;border:1px solid #333'&gt;"
   *              +     "欢迎使用百度地图！"
   *              +     "&lt;img src='http://map.baidu.com/img/logo-map.gif' border='0' /&gt;"
   *              + "&lt;/div&gt;";
   * var point = new BMap.Point(116.30816, 40.056863);
   * var myToolTimeBarObject = new BMapLib.ToolTimeBar(htm, point, {"anchor": new BMap.Size(-72, -84), "enableDragging": true});
   * map.addOverlay(myToolTimeBarObject);
   */
  BMapLib.ToolTimeBar = function () {
    /**
     * map对象
     * @private
     * @type {Map}
     */
    this._map = null;
    this._data = null;
    this._keys = null;

    /**
     * Marker内容
     * @private
     * @type {String | HTMLElement}
     */
    this._content = '<div class="tool-timebar">\
        <a class="btn-control play" href="javascript:void(0)">播放</a>\
        <div class="drag-lab">\
          <div class="lab-item">2016-01-01</div>\
          <div class="lab-item">2016-02-01</div>\
          <div class="lab-item">2016-03-01</div>\
          <div class="lab-item">2016-04-01</div>\
          <div class="lab-item">2016-05-01</div>\
        </div>\
        <a class="btn-drag" href="javascript:void(0)">拖动点</a>\
        <div class="lab hide">\
          整体准确度: 86%<br>\
          预测时间: 2016-09-01\
        </div>\
      </div>';
    /**
     * marker主容器
     * @private
     * @type {HTMLElement}
     */
    this._container = null;

    this._startX = 60;
    this._maxX = 520;
    this._dis = 30;
    this._xOffset = 14;

    this._interval = null; // 时间句柄
    this._intervalTime = 3000; // 时间间隔
    this._selected = 1; // 当前选择

    this.defaultAnchor = BMAP_ANCHOR_TOP_LEFT;
    this.defaultOffset = new BMap.Size(300, 70);
  }

  // 继承覆盖物类
  ToolTimeBar.prototype = new BMap.Control();

  /**
   * 初始化，实现自定义覆盖物的initialize方法
   * 主要生成Marker的主容器，填充自定义的内容，并附加事件
   *
   * @private
   * @param {BMap} map map实例对象
   * @return {Dom} 返回自定义生成的dom节点
   */
  ToolTimeBar.prototype.initialize = function (map) {
    var me = this,
        div = me._container = document.createElement("div");
    me._map = map;
    map.getContainer().appendChild(div);


    // 给主容器添加上用户自定义的内容
    me._appendContent();
    // 给主容器添加事件处理
    me._setEventDispath();

    return div;
  }
  /**
   * 添加用户的自定义的内容
   *
   * @private
   * @return 无返回值
   */
  ToolTimeBar.prototype._appendContent = function () {
      var content = this._content;
      // 用户输入的内容是字符串，需要转化成dom节点
      if (typeof content == "string") {
          var div = document.createElement('DIV');
          div.innerHTML = content;
          if (div.childNodes.length == 1) {
              content = (div.removeChild(div.firstChild));
          } else {
              var fragment = document.createDocumentFragment();
              while (div.firstChild) {
                  fragment.appendChild(div.firstChild);
              }
              content = fragment;
          }
      }
      this._container.innerHTML = "";
      this._container.appendChild(content);
  }

  /**
   * 获取Marker的内容
   * @return {String | HTMLElement} 当前内容
   *
   * @example <b>参考示例：</b>
   * myMonitoringPointsObject.getContent();
   */
  ToolTimeBar.prototype.getContent = function () {
      return this._content;
  }

  /**
   * 设置Marker的内容
   * @param {String | HTMLElement} content 需要设置的内容
   * @return 无返回值
   *
   * @example <b>参考示例：</b>
   * var htm = "&lt;div style='background:#E7F0F5;color:#0082CB;border:1px solid #333'&gt;"
   *              +     "欢迎使用百度地图API！"
   *              +     "&lt;img src='http://map.baidu.com/img/logo-map.gif' border='0' /&gt;"
   *              + "&lt;/div&gt;";
   * myMonitoringPointsObject.setContent(htm);
   */
  ToolTimeBar.prototype.setContent = function (content) {
      if (!content) {
          return;
      }
      // 存储用户输入的Marker显示内容
      this._content = content;
      // 添加进主容器
      this._appendContent();
  }

  ToolTimeBar.prototype.reset = function (data, show) {
    var px = 0,
        drag = $(this._container).find('.btn-drag');
    this.formatData(data);
    this.stopInterval();
    this._selected = 1;
    px = (this._selected-1)*this._dis+this._startX;
    drag.css('left', px+'px');
    console.log(show);
    if (show)
      $(this._container).find('.lab').show();
    else
      $(this._container).find('.lab').hide();
    _dispatchEvent(this, "onselected", {selected:this._selected,data:this._data[this._selected-1][this._keys[this._selected-1]]});
  }

  ToolTimeBar.prototype.formatData = function (data) {
    this._data = data;
    this._keys = [];
    var i,j,html = '';

    for (i in data)
      for (j in data[i])
        this._keys.push(j);

    for (i in this._keys)
      html += $.sprintf('<div class="lab-item" style="left:%spx">%s</div>', 460/(this._keys.length-1)*i-40, this._keys[i]);

    $(this._container).find('.drag-lab').html(html);

    this._dis = (this._maxX-this._startX)/(this._keys.length-1);
  }

  ToolTimeBar.prototype.stopInterval = function () {
    if (this._interval != null) {
      clearInterval(this._interval);
      this._interval = null;
    }
  }
  /**
   * 设置Marker的各种事件
   *
   * @private
   * @return 无返回值
   */
  ToolTimeBar.prototype._setEventDispath = function () {
    var me = this,
        div = me._container,
        isMouseDown = false,
        selected = 1;
        // 鼠标是否按下，用以判断鼠标移动过程中的拖拽计算

    // 通过e参数获取当前鼠标所在位置
    function _getPositionByEvent(e) {
        var e = window.event || e,
            x = e.pageX || e.clientX || 0,
            y = e.pageY || e.clientY || 0,
            pixel = new BMap.Pixel(x, y),
            point = me._map.pixelToPoint(pixel);
        return {
            "pixel": pixel,
            "point": point
        };
    }
    function _getOffsetByEvent(e) {
      var e = window.event || e,
          p = $(me._container).offset(),
          x = e.pageX || e.clientX || 0,
          x = x - p.left,
          y = e.pageY || e.clientY || 0,
          y = y - p.top;
      return new BMap.Pixel(x, y);
    }
    function _timeprogress(e){
      var px = 0,
          drag = $(me._container).find('.btn-drag');
      me._selected++;
      if (me._selected > me._keys.length) me._selected = 1;
      px = (me._selected-1)*me._dis+me._startX;
      drag.css('left', px+'px');
      _dispatchEvent(me, "onselected", {selected:me._selected,data:me._data[me._selected-1][me._keys[me._selected-1]]});
    }

    function _controlEvent(e){
      var cur = $(e.target);
      me.stopInterval();
      if (cur.hasClass('play')) {
        cur.removeClass('play').addClass('pause');
        me._interval = window.setInterval(_timeprogress, me._intervalTime)
      } else
        cur.removeClass('pause').addClass('play');
      _stopAndPrevent(e);
    }
    function _dragDownEvent(e){
      isMouseDown = true;
      _stopAndPrevent(e);
    }
    function _dragMoveEvent(e){
      if (isMouseDown == false) return;
      var p = _getOffsetByEvent(e),
          px = p.x,
          drag = $(me._container).find('.btn-drag');
      if (px <= me._startX) px = me._startX;
      else if (px >= me._maxX) px = me._maxX;
      drag.css('left', px+'px');
      _stopAndPrevent(e);
    }
    function _dragUpEvent(e){
      isMouseDown = false;
      var p = _getOffsetByEvent(e),
          px = p.x+me._dis/2-me._xOffset,
          drag = $(me._container).find('.btn-drag');

      if (px <= me._startX-10 || px >= me._maxX+me._dis/2+10) return;
      if (px <= me._startX) px = me._startX;
      else if (px >= me._maxX+me._dis) px = me._maxX;


      me._selected = Math.floor((px-me._startX)/me._dis)+1;
      px = (me._selected-1)*me._dis+me._startX;
      drag.css('left', px+'px');
      _dispatchEvent(me, "onselected", {selected:me._selected,data:me._data[me._selected-1][me._keys[me._selected-1]]});
      _stopAndPrevent(e);
    }

    baidu.on($(div).find('.btn-control')[0], 'onclick', _controlEvent);
    baidu.on($(div).find('.btn-drag')[0], 'onmousedown', _dragDownEvent);
    baidu.on($(div).find('.btn-drag')[0], 'mousemove', _dragMoveEvent);
    baidu.on(div, 'mousemove', _dragMoveEvent);
    baidu.on(div, 'onmouseup', _dragUpEvent);
    baidu.on($(div).find('.btn-drag')[0], 'onmouseup', _dragUpEvent);
  }



  /**
   * 集中派发事件函数
   *
   * @private
   * @param {Object} instance 派发事件的实例
   * @param {String} type 派发的事件名
   * @param {Json} opts 派发事件里添加的参数，可选
   */
  function _dispatchEvent(instance, type, opts) {
    type.indexOf("on") != 0 && (type = "on" + type);
    var event = new baidu.lang.Event(type);
    if ( !! opts) {
      for (var p in opts) {
        event[p] = opts[p];
      }
    }
    instance.dispatchEvent(event);
  }

  /**
   * 清理DOM事件，防止循环引用
   *
   * @type {DOM} dom 需要清理的dom对象
   */
  function _purge(dom) {
    if (!dom) {
      return;
    }
    var attrs = dom.attributes,
        name = "";
    if (attrs) {
      for (var i = 0, n = attrs.length; i < n; i++) {
        name = attrs[i].name;
        if (typeof dom[name] === "function") {
          dom[name] = null;
        }
      }
    }
    var child = dom.childnodes;
    if (child) {
      for (var i = 0, n = child.length; i < n; i++) {
        _purge(dom.childnodes[i]);
      }
    }
  }

  /**
   * 停止事件冒泡传播
   *
   * @type {Event} e e对象
   */
  function _stopAndPrevent(e) {
    var e = window.event || e;
    e.stopPropagation ? e.stopPropagation() : e.cancelBubble = true;
    return baidu.preventDefault(e);
  }
})();

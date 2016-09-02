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
   * @exports ToolFilter as BMapLib.ToolFilter
   */
  var ToolFilter =
  /**
   * ToolFilter类的构造函数
   * @class 富Marker定义类，实现丰富的Marker展现效果。
   *
   * @constructor
   * @param {String | HTMLElement} content 用户自定义的Marker内容，可以是字符串，也可以是dom节点
   * @param {BMap.Point} position marker的位置
   * @param {Json} ToolFilterOptions 可选的输入参数，非必填项。可输入选项包括：<br />
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
   * var myToolFilterObject = new BMapLib.ToolFilter(htm, point, {"anchor": new BMap.Size(-72, -84), "enableDragging": true});
   * map.addOverlay(myToolFilterObject);
   */
  BMapLib.ToolFilter = function () {
    /**
     * map对象
     * @private
     * @type {Map}
     */
    this._map = null;

    /**
     * Marker内容
     * @private
     * @type {String | HTMLElement}
     */
    this._content = '<div class="tool-filer">\
      <div class="tf-icon"></div>\
      <div class="tf-box">\
        <div class="tf-bt-close">关闭</div>\
        <ul class="tf-tab">\
          <li class="tf-tab1 selected" data-target="tfArea">区县</li>\
          <li class="tf-tab2" data-target="tfMain">原水</li>\
          <li class="tf-tab3" data-target="tfTap">出厂水</li>\
          <li class="tf-tab4" data-target="tfRaw">管网水</li>\
        </ul>\
        <div id="tfArea" class="tf-panel" style="display: block">\
          <label><input type="checkbox" name="selectAll" checked> 全选</label><br>\
          <label><input type="checkbox" name="areaName" value="黄浦区" checked> 黄浦区</label>\
          <label><input type="checkbox" name="areaName" value="徐汇区" checked> 徐汇区</label>\
          <label><input type="checkbox" name="areaName" value="长宁区" checked> 长宁区</label>\
          <label><input type="checkbox" name="areaName" value="静安区" checked> 静安区</label>\
          <label><input type="checkbox" name="areaName" value="普陀区" checked> 普陀区</label>\
          <label><input type="checkbox" name="areaName" value="虹口区" checked> 虹口区</label>\
          <label><input type="checkbox" name="areaName" value="杨浦区" checked> 杨浦区</label>\
          <label><input type="checkbox" name="areaName" value="闵行区" checked> 闵行区</label>\
          <label><input type="checkbox" name="areaName" value="宝山区" checked> 宝山区</label>\
          <label><input type="checkbox" name="areaName" value="嘉定区" checked> 嘉定区</label>\
          <label><input type="checkbox" name="areaName" value="浦东新区" checked> 浦东新区</label>\
          <label><input type="checkbox" name="areaName" value="金山区" checked> 金山区</label>\
          <label><input type="checkbox" name="areaName" value="松江区" checked> 松江区</label>\
          <label><input type="checkbox" name="areaName" value="青浦区" checked> 青浦区</label>\
          <label><input type="checkbox" name="areaName" value="闸北区" checked> 闸北区</label>\
          <label><input type="checkbox" name="areaName" value="奉贤区" checked> 奉贤区</label>\
          <label><input type="checkbox" name="areaName" value="崇明区" checked> 崇明区</label>\
        </div>\
        <div id="tfMain" class="tf-panel">\
          <label><input type="checkbox" name="selectAll" checked> 全选</label><br>\
          <label><input type="checkbox" name="prepoint" value="青草沙水库" checked> 青草沙水库</label>\
          <label><input type="checkbox" name="prepoint" value="陈行水库" checked> 陈行水库</label>\
          <label><input type="checkbox" name="prepoint" value="东风西沙水库" checked> 东风西沙水库</label>\
          <label><input type="checkbox" name="prepoint" value="金泽水库" checked> 金泽水库</label>\
        </div>\
        <div id="tfTap" class="tf-panel">\
          <label><input type="checkbox" name="selectAll" checked> 全选</label><br>\
          <dl>\
            <dt>级别:</dt>\
            <dd>\
              <label><input type="checkbox" name="lvl" value="市级" checked> 市级</label>\
              <label><input type="checkbox" name="lvl" value="区级" checked> 区级</label>\
              <label><input type="checkbox" name="lvl" value="乡镇级" checked> 乡镇级</label>\
              <label><input type="checkbox" name="lvl" value="自建" checked> 自建</label>\
            </dd>\
            <dt>处理类型:</dt>\
            <dd>\
              <label><input type="checkbox" name="pcf" value="深度处理" checked> 深度处理</label>\
              <label><input type="checkbox" name="pcf" value="常规处理" checked> 常规处理</label>\
            </dd>\
            <dt>监测点状态:</dt>\
            <dd>\
              <label><input type="checkbox" name="tapState" value="有效" checked> 在监</label>\
              <label><input type="checkbox" name="tapState" value="无效" checked> 取消</label>\
            </dd>\
          </dl>\
        </div>\
        <div id="tfRaw" class="tf-panel">\
          <label><input type="checkbox" name="selectAll" checked> 全选</label><br>\
          <dl>\
            <dt>监测方法:</dt>\
            <dd>\
              <label><input type="checkbox" name="mtd" value="在线监测" checked> 在线监测</label>\
              <label><input type="checkbox" name="mtd" value="离线监测" checked> 离线监测</label>\
            </dd>\
            <dt>监测点状态:</dt>\
            <dd>\
              <label><input type="checkbox" name="rawState" value="有效" checked> 在监</label>\
              <label><input type="checkbox" name="rawState" value="无效" checked> 取消</label>\
            </dd>\
          </dl>\
        </div>\
      </div>\
    </div>';
    /**
     * marker主容器
     * @private
     * @type {HTMLElement}
     */
    this._container = null;

    this.defaultAnchor = BMAP_ANCHOR_TOP_RIGHT;
    this.defaultOffset = new BMap.Size(10, 10);
  }

  // 继承覆盖物类
  ToolFilter.prototype = new BMap.Control();

  /**
   * 初始化，实现自定义覆盖物的initialize方法
   * 主要生成Marker的主容器，填充自定义的内容，并附加事件
   *
   * @private
   * @param {BMap} map map实例对象
   * @return {Dom} 返回自定义生成的dom节点
   */
  ToolFilter.prototype.initialize = function (map) {
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
  ToolFilter.prototype._appendContent = function () {
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
  ToolFilter.prototype.getContent = function () {
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
  ToolFilter.prototype.setContent = function (content) {
      if (!content) {
          return;
      }
      // 存储用户输入的Marker显示内容
      this._content = content;
      // 添加进主容器
      this._appendContent();
  }

  /**
   * 设置Marker的各种事件
   *
   * @private
   * @return 无返回值
   */
  ToolFilter.prototype._setEventDispath = function () {
    var me = this,
        div = me._container,
        isMouseDown = false,
        // 鼠标是否按下，用以判断鼠标移动过程中的拖拽计算
        startPosition = null; // 拖拽时，鼠标按下的初始位置，拖拽的辅助计算参数

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
    function _tabEvent(e){
      $('.tf-tab li').removeClass('selected');
      $(e.target).addClass('selected');
      $('.tf-panel').css('display', 'none');
      $('#'+$(e.target).data('target')).css('display', 'block');
    }

    baidu.on($('.tf-icon')[0],'onclick', function(e){
      $('.tf-box').css('display', ($('.tf-box').css('display') == 'none'?'block':'none'));
    });
    baidu.on($('.tf-bt-close')[0],'onclick', function(e){
      $('.tf-box').css('display', 'none');
    });

    baidu.on($('.tf-tab1')[0],'onclick', _tabEvent);
    baidu.on($('.tf-tab2')[0],'onclick', _tabEvent);
    baidu.on($('.tf-tab3')[0],'onclick', _tabEvent);
    baidu.on($('.tf-tab4')[0],'onclick', _tabEvent);

    $('.tool-filer input:checkbox[name=selectAll]').on('ifChanged', function(e){
      var t = $(e.currentTarget)
        , els = t.parents('.tf-panel').find('input:checkbox[name!=selectAll]')
        , data = {areaName:[],prepoint:[],lvl:[],pcf:[],tapState:[],mtd:[],rawState:[]};
      els.iCheck(t.prop('checked')?'check':'uncheck');
      $('.tool-filer input:checkbox[name!=selectAll]').each(function(){
        if ($(this).prop('checked') == true) {
          data[$(this).attr('name')].push($(this).val());
        }
      });
      _dispatchEvent(me, "onfilter", {data:data});
      _stopAndPrevent(e);
    });

    $('.tool-filer input:checkbox[name!=selectAll]').on('ifClicked', function(e){
      $(e.currentTarget).prop('checked', !$(e.currentTarget).prop('checked'));
      var data = {areaName:[],prepoint:[],lvl:[],pcf:[],tapState:[],mtd:[],rawState:[]};
      $('.tool-filer input:checkbox[name!=selectAll]').each(function(){
        if ($(this).prop('checked') == true) {
          data[$(this).attr('name')].push($(this).val());
        }
      });
      /*
      data = {
        areaName: data.areaName.join(','),
        prepoint: data.prepoint.join(','),
        lvl: data.lvl.join(','),
        pcf: data.pcf.join(','),
        tapState: data.tapState.join(','),
        mtd: data.mtd.join(','),
        rawState: data.rawState.join(',')
      };
      */
      _dispatchEvent(me, "onfilter", {data:data});
      _stopAndPrevent(e);
    });
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

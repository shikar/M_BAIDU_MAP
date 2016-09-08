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
  })();
  /**
   * @exports MonitoringInfo as BMapLib.MonitoringInfo
   */
  var MonitoringInfo =
  /**
   * MonitoringInfo类的构造函数
   * @class 富Marker定义类，实现丰富的Marker展现效果。
   *
   * @constructor
   * @param {String | HTMLElement} content 用户自定义的Marker内容，可以是字符串，也可以是dom节点
   * @param {BMap.Point} position marker的位置
   * @param {Json} MonitoringInfoOptions 可选的输入参数，非必填项。可输入选项包括：<br />
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
   * var myMonitoringInfoObject = new BMapLib.MonitoringInfo(htm, point, {"anchor": new BMap.Size(-72, -84), "enableDragging": true});
   * map.addOverlay(myMonitoringInfoObject);
   */
  BMapLib.MonitoringInfo = function (params) {
    if (!params) {
      return;
    }
    this._params = params;
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
    var typeLab = {0:'原水', 1:'出厂水', 2:'管网水'}
    this._content = '<div class="icon-info">' +
        '  <div class="icon-info-title">' + params.title + '</div>' +
        '  <div class="icon-info-title-small">' + typeLab[params.type] + '</div>' +
        '  <div class="icon-info-exp">' + params.exponential + '</div>' +
        '  <div class="icon-info-desc">' + params.exponentialDes + '</div>' +
        '</div>';

    /**
     * marker显示位置
     * @private
     * @type {BMap.Point}
     */
    this._position = new BMap.Point(params.lng, params.lat);
    /**
     * marker主容器
     * @private
     * @type {HTMLElement}
     */
    this._container = null;

    /**
     * marker主容器的尺寸
     * @private
     * @type {BMap.Size}
     */
    this._size = null;
    this._zIndex = 99999;

    opts = {};
    /**
     * _opts是默认参数赋值。
     * 下面通过用户输入的opts，对默认参数赋值
     * @private
     * @type {Json}
     */
    this._opts = baidu.extend(
      baidu.extend(this._opts || {}, {
        align: WinInfo_AT_TOP,
        offset: opts.offset || new BMap.Size(0,50),
        /**
         * Marker的偏移量
         * @private
         * @type {BMap.Size}
         */
        anchor: new BMap.Size(-107, -208)
      }), opts);
  }

  // 继承覆盖物类
  MonitoringInfo.prototype = new BMap.Overlay();

  /**
   * 初始化，实现自定义覆盖物的initialize方法
   * 主要生成Marker的主容器，填充自定义的内容，并附加事件
   *
   * @private
   * @param {BMap} map map实例对象
   * @return {Dom} 返回自定义生成的dom节点
   */
  MonitoringInfo.prototype.initialize = function (map) {
    var me = this,
        div = me._container = document.createElement("div");
    me._map = map;
    baidu.extend(div.style, {
      position: "absolute",
      zIndex: me._zIndex
    });
    map.getPanes().labelPane.appendChild(div);

    // 给主容器添加上用户自定义的内容
    me._appendContent();
    // 获取主容器的高宽
    me._getContainerSize();
    // me._panBox();
    return div;
  }

  /**
   * 为自定义的Marker设定显示位置，实现自定义覆盖物的draw方法
   *
   * @private
   */
  MonitoringInfo.prototype.draw = function () {
      var map = this._map,
          anchor = this._opts.anchor,
          pixel = map.pointToOverlayPixel(this._position);
      this._container.style.left = pixel.x + anchor.width + "px";
      this._container.style.top = pixel.y + anchor.height + "px";
  }

  /**
   * 获取Marker的显示位置
   * @return {BMap.Point} 显示的位置
   *
   * @example <b>参考示例：</b>
   * myMonitoringInfoObject.getPosition();
   */
  MonitoringInfo.prototype.getPosition = function () {
      return this._position;
  }

  /**
   * 设置Marker的显示位置
   * @param {BMap.Point} position 需要设置的位置
   * @return 无返回值
   *
   * @example <b>参考示例：</b>
   * myMonitoringInfoObject.setPosition(new BMap.Point(116.30816, 40.056863));
   */
  MonitoringInfo.prototype.setPosition = function (position) {
      if (!position instanceof BMap.Point) {
          return;
      }
      this._position = position;
      this.draw();
  }

  /**
   * 获取Marker的偏移量
   * @return {BMap.Size} Marker的偏移量
   *
   * @example <b>参考示例：</b>
   * myMonitoringInfoObject.getAnchor();
   */
  MonitoringInfo.prototype.getAnchor = function () {
      return this._opts.anchor;
  }

  /**
   * 设置Marker的偏移量
   * @param {BMap.Size} anchor 需要设置的偏移量
   * @return 无返回值
   *
   * @example <b>参考示例：</b>
   * myMonitoringInfoObject.setAnchor(new BMap.Size(-72, -84));
   */
  MonitoringInfo.prototype.setAnchor = function (anchor) {
      if (!anchor instanceof BMap.Size) {
          return;
      }
      this._opts.anchor = anchor;
      this.draw();
  }

  /**
   * 获取Marker的内容
   * @return {String | HTMLElement} 当前内容
   *
   * @example <b>参考示例：</b>
   * myMonitoringInfoObject.getContent();
   */
  MonitoringInfo.prototype.getContent = function () {
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
   * myMonitoringInfoObject.setContent(htm);
   */
  MonitoringInfo.prototype.setContent = function (content) {
      if (!content) {
          return;
      }
      // 存储用户输入的Marker显示内容
      this._content = content;
      // 添加进主容器
      this._appendContent();
  }

  /**
   * 获取Marker的宽度
   * @return {Number} 当前宽度
   *
   * @example <b>参考示例：</b>
   * myMonitoringInfoObject.getWidth();
   */
  MonitoringInfo.prototype.getWidth = function () {
      if (!this._size) {
          return;
      }
      return this._size.width;
  }

  /**
   * 设置Marker的宽度
   * @param {Number} width 需要设置的宽度
   * @return 无返回值
   *
   * @example <b>参考示例：</b>
   * myMonitoringInfoObject.setWidth(300);
   */
  MonitoringInfo.prototype.setWidth = function (width) {
      if (!this._container) {
          return;
      }
      this._container.style.width = width + "px";
      this._getContainerSize();
  }

  /**
   * 获取Marker的高度
   * @return {Number} 当前高度
   *
   * @example <b>参考示例：</b>
   * myMonitoringInfoObject.getHeight();
   */
  MonitoringInfo.prototype.getHeight = function () {
      if (!this._size) {
          return;
      }
      return this._size.height;
  }

  /**
   * 设置Marker的高度
   * @param {Number} height 需要设置的高度
   * @return 无返回值
   *
   * @example <b>参考示例：</b>
   * myMonitoringInfoObject.setHeight(200);
   */
  MonitoringInfo.prototype.setHeight = function (height) {
      if (!this._container) {
          return;
      }
      this._container.style.height = height + "px";
      this._getContainerSize();
  }

  /**
   * 删除Marker
   *
   * @private
   * @return 无返回值
   */
  MonitoringInfo.prototype.remove = function () {
    // 清除主容器上的事件绑定
    if (this._container) {
      _purge(this._container);
    }
    // 删除主容器
    if (this._container && this._container.parentNode) {
      this._container.parentNode.removeChild(this._container);
    }
  }
  baidu.extend(MonitoringInfo.prototype, {
    /**
     * 添加用户的自定义的内容
     *
     * @private
     * @return 无返回值
     */
    _appendContent: function () {
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
    },
    /**
     * 获取Marker的高宽
     *
     * @private
     * @return {BMap.Size} 当前高宽
     */
    _getContainerSize: function () {
        if (!this._container) {
            return;
        }
        var h = this._container.offsetHeight;
        var w = this._container.offsetWidth;
        this._size = new BMap.Size(w, h);
    },
    /**
     * 自动平移WinInfo，使其在视野中全部显示
     * @return none
     */
    _panBox: function(){
        var mapH = parseInt(this._map.getContainer().offsetHeight,10),
            mapW = parseInt(this._map.getContainer().offsetWidth,10),
            boxH = this._size.height,
            boxW = this._size.width;
        //WinInfo窗口本身的宽度或者高度超过map container
        if(boxH >= mapH || boxW >= mapW){
            return;
        }
        //如果point不在可视区域内
        if(!this._map.getBounds().containsPoint(this._position)){
            this._map.setCenter(this._position);
        }
        var anchorPos = this._map.pointToPixel(this._position),
            panTop,panBottom,panY,
            //左侧超出
            panLeft = boxW / 2 - anchorPos.x,
            //右侧超出
            panRight = boxW / 2 + anchorPos.x - mapW;
        if(this._marker){
            var icon = this._marker.getIcon();
        }
        //基于bottom定位，也就是WinInfo在上方的情况
        switch(this._opts.align){
            case WinInfo_AT_TOP:
                //上侧超出
                var h = this._marker ? icon.anchor.height + this._marker.getOffset().height - icon.infoWindowAnchor.height : 0;
                panTop = boxH - anchorPos.y + this._opts.offset.height + h + 2 ;
                break;
            case WinInfo_AT_BOTTOM:
                //下侧超出
                var h = this._marker ? -icon.anchor.height + icon.infoWindowAnchor.height + this._marker.getOffset().height + this._opts.offset.height : 0;
                panBottom = boxH + anchorPos.y - mapH + h + 4;
                break;
        }

        panX = panLeft > 0 ? panLeft : (panRight > 0 ? -panRight : 0);
        panY = panTop > 0 ? panTop : (panBottom > 0 ? -panBottom : 0);
        this._map.panBy(panX,panY);
    }
  });


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
})();

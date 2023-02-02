"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;
var _react = _interopRequireWildcard(require("react"));
var _react2 = require("@emotion/react");
var _reactJsxParser = _interopRequireDefault(require("react-jsx-parser"));
var _antd = require("antd");
function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }
function _getRequireWildcardCache(nodeInterop) { if (typeof WeakMap !== "function") return null; var cacheBabelInterop = new WeakMap(); var cacheNodeInterop = new WeakMap(); return (_getRequireWildcardCache = function (nodeInterop) { return nodeInterop ? cacheNodeInterop : cacheBabelInterop; })(nodeInterop); }
function _interopRequireWildcard(obj, nodeInterop) { if (!nodeInterop && obj && obj.__esModule) { return obj; } if (obj === null || typeof obj !== "object" && typeof obj !== "function") { return { default: obj }; } var cache = _getRequireWildcardCache(nodeInterop); if (cache && cache.has(obj)) { return cache.get(obj); } var newObj = {}; var hasPropertyDescriptor = Object.defineProperty && Object.getOwnPropertyDescriptor; for (var key in obj) { if (key !== "default" && Object.prototype.hasOwnProperty.call(obj, key)) { var desc = hasPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : null; if (desc && (desc.get || desc.set)) { Object.defineProperty(newObj, key, desc); } else { newObj[key] = obj[key]; } } } newObj.default = obj; if (cache) { cache.set(obj, newObj); } return newObj; }
function _extends() { _extends = Object.assign ? Object.assign.bind() : function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; }; return _extends.apply(this, arguments); }
const PRIMTIVES = ['boolean', 'number', 'string'];
const PRIMTIVES_W_OBJ = ['boolean', 'number', 'object', 'string'];
const INITIAL_BINDINGS = {
  log: console.log,
  h: _react.default.createElement
};
const COMPONENT_MAP = {
  Row: _antd.Row,
  Col: _antd.Col
};
const parseFunction = _ref => {
  let {
    args = {},
    parse,
    warn = false
  } = _ref;
  const keys = Object.keys(args).join(', ');
  try {
    const fn = new Function(`{ ${keys} }`, `return ${parse}`)(args);
    return fn;
  } catch (e) {
    if (warn) {
      console.warn(`Failed to parse function: ${parse}`);
    }
    return undefined;
  }
};
const renderError = (jsx, fallback, warn) => {
  if (warn) {
    console.warn(`Failed to parse expression "${jsx}". Rendering fallback.`);
  }
  return fallback || '';
};
const jsxParser = (bindings, _fallback_, showWarnings) => (jsx, __fallback__, mappedComponents) => (0, _react2.jsx)(_reactJsxParser.default, {
  bindings: bindings,
  jsx: jsx,
  components: mappedComponents,
  renderInWrapper: false,
  renderError: () => renderError(jsx, _fallback_ || __fallback__, showWarnings)
});
const parseDefinitions = (definitions, bindings, showWarnings) => {
  return Object.keys(definitions).reduce((acc, definitionName) => {
    const bindingsToPass = {
      ...acc
    };
    acc[definitionName] = parseFunction({
      args: {
        ...bindingsToPass,
        jsx: jsxParser(bindingsToPass, '', showWarnings)
      },
      parse: definitions[definitionName],
      warn: showWarnings
    });
    return acc;
  }, bindings);
};
const parseStructure = function (structure, parentData, bindings, showWarnings, componentMap) {
  let nestedLevel = arguments.length > 5 && arguments[5] !== undefined ? arguments[5] : 0;
  return structure.map((element, i) => {
    if (PRIMTIVES.includes(typeof element)) {
      return element;
    }
    const mappedComponents = {
      ...COMPONENT_MAP,
      ...componentMap
    };
    const Tag = mappedComponents[element?.tag] || element.tag || _react.default.Fragment;
    let emotionCSS = {};
    if (element?.css) {
      emotionCSS = {
        css: (0, _react2.css)`
                    ${element.css}
                `
      };
    }
    let childElements = null;
    if (element.jsx) {
      childElements = jsxParser(bindings, showWarnings)(element.jsx, element.fallback, mappedComponents);
    }
    if (Array.isArray(element?.children)) {
      childElements = parseStructure(element.children, parentData, bindings, showWarnings, componentMap, nestedLevel + 1);
    } else if (PRIMTIVES_W_OBJ.includes(typeof element?.children)) {
      childElements = element.children;
    }
    const tagKey = `el-${nestedLevel}-${i}`;
    return (0, _react2.jsx)(Tag, _extends({}, element.props, emotionCSS, {
      key: tagKey
    }), childElements);
  });
};
const Template = props => {
  const {
    data: {
      data
    },
    properties
  } = props;
  const {
    template: structure = [],
    define = {},
    bindings: parentData,
    showWarnings = false,
    componentMap
  } = properties;
  const useForceUpdate = () => {
    const [, updateState] = (0, _react.useState)();
    return (0, _react.useCallback)(() => updateState({}), []);
  };
  let bindings = {
    ...INITIAL_BINDINGS,
    data: {
      ...data,
      ...parentData
    },
    update: useForceUpdate()
  };
  const definitions = parseDefinitions(define, bindings, showWarnings);
  bindings = {
    ...bindings,
    ...definitions
  };
  return parseStructure(structure, parentData, bindings, showWarnings, componentMap);
};
var _default = Template;
exports.default = _default;
module.exports = exports.default;
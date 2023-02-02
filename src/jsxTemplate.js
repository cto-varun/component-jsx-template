import React, { useCallback, useEffect, useState } from 'react';
/** @jsx emotionJSX */
import { css, jsx as emotionJSX } from '@emotion/react';
import JSXParser from 'react-jsx-parser';
import { Row, Col } from 'antd';

const PRIMTIVES = ['boolean', 'number', 'string'];
const PRIMTIVES_W_OBJ = ['boolean', 'number', 'object', 'string'];
const INITIAL_BINDINGS = {
    log: console.log,
    h: React.createElement,
};
const COMPONENT_MAP = {
    Row,
    Col,
};

const parseFunction = ({ args = {}, parse, warn = false }) => {
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
        console.warn(
            `Failed to parse expression "${jsx}". Rendering fallback.`
        );
    }
    return fallback || '';
};

const jsxParser = (bindings, _fallback_, showWarnings) => (
    jsx,
    __fallback__,
    mappedComponents
) => (
    <JSXParser
        bindings={bindings}
        jsx={jsx}
        components={mappedComponents}
        renderInWrapper={false}
        renderError={() =>
            renderError(jsx, _fallback_ || __fallback__, showWarnings)
        }
    />
);

const parseDefinitions = (definitions, bindings, showWarnings) => {
    return Object.keys(definitions).reduce((acc, definitionName) => {
        const bindingsToPass = {
            ...acc,
        };
        acc[definitionName] = parseFunction({
            args: {
                ...bindingsToPass,
                jsx: jsxParser(bindingsToPass, '', showWarnings),
            },
            parse: definitions[definitionName],
            warn: showWarnings,
        });
        return acc;
    }, bindings);
};

const parseStructure = (
    structure,
    parentData,
    bindings,
    showWarnings,
    componentMap,
    nestedLevel = 0
) => {
    return structure.map((element, i) => {
        if (PRIMTIVES.includes(typeof element)) {
            return element;
        }

        const mappedComponents = {
            ...COMPONENT_MAP,
            ...componentMap,
        };

        const Tag =
            mappedComponents[element?.tag] || element.tag || React.Fragment;
        let emotionCSS = {};
        if (element?.css) {
            emotionCSS = {
                css: css`
                    ${element.css}
                `,
            };
        }
        let childElements = null;
        if (element.jsx) {
            childElements = jsxParser(bindings, showWarnings)(
                element.jsx,
                element.fallback,
                mappedComponents
            );
        }

        if (Array.isArray(element?.children)) {
            childElements = parseStructure(
                element.children,
                parentData,
                bindings,
                showWarnings,
                componentMap,
                nestedLevel + 1
            );
        } else if (PRIMTIVES_W_OBJ.includes(typeof element?.children)) {
            childElements = element.children;
        }

        const tagKey = `el-${nestedLevel}-${i}`;

        return (
            <Tag {...element.props} {...emotionCSS} key={tagKey}>
                {childElements}
            </Tag>
        );
    });
};

const Template = (props) => {
    const {
        data: { data },
        properties,
    } = props;
    const {
        template: structure = [],
        define = {},
        bindings: parentData,
        showWarnings = false,
        componentMap,
    } = properties;

    const useForceUpdate = () => {
        const [, updateState] = useState();
        return useCallback(() => updateState({}), []);
    };

    let bindings = {
        ...INITIAL_BINDINGS,
        data: { ...data, ...parentData },
        update: useForceUpdate(),
    };
    const definitions = parseDefinitions(define, bindings, showWarnings);
    bindings = {
        ...bindings,
        ...definitions,
    };
    return parseStructure(
        structure,
        parentData,
        bindings,
        showWarnings,
        componentMap
    );
};

export default Template;

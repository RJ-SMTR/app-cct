import FuseExample from '@fuse/core/FuseExample';
import FuseHighlight from '@fuse/core/FuseHighlight';
import FuseSvgIcon from '@fuse/core/FuseSvgIcon';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
/* eslint import/no-webpack-loader-syntax: off */
/* eslint import/extensions: off */
/* eslint no-unused-vars: off */
/* eslint-disable jsx-a11y/accessible-emoji */

function StackDoc(props) {
  return (
    <>
      <div className="flex flex-1 grow-0 items-center justify-end">
        <Button
          className="normal-case"
          variant="contained"
          color="secondary"
          component="a"
          href="https://mui.com/components/stack"
          target="_blank"
          role="button"
          startIcon={<FuseSvgIcon>heroicons-outline:external-link</FuseSvgIcon>}
        >
          Reference
        </Button>
      </div>
      <Typography className="text-40 my-16 font-700" component="h1">
        Stack
      </Typography>
      <Typography className="description">
        Stack is a container component for arranging elements vertically or horizontally.
      </Typography>

      <Typography className="text-32 mt-40 mb-10 font-700" component="h2">
        Introduction
      </Typography>
      <Typography className="mb-40" component="div">
        The Stack component manages the layout of its immediate children along the vertical or
        horizontal axis, with optional spacing and dividers between each child.
      </Typography>
      <Typography className="mb-40" component="div">
        :::info Stack is ideal for one-dimensional layouts, while Grid is preferable when you need
        both vertical <em>and</em> hortizontal arrangement. :::
      </Typography>
      <Typography className="text-32 mt-40 mb-10 font-700" component="h2">
        Basics
      </Typography>

      <FuseHighlight component="pre" className="language-jsx">
        {` 
import Stack from '@mui/material/Stack';
`}
      </FuseHighlight>
      <Typography className="mb-40" component="div">
        The Stack component acts as a generic container, wrapping around the elements to be
        arranged.
      </Typography>
      <Typography className="mb-40" component="div">
        Use the <code>spacing</code> prop to control the space between children. The spacing value
        can be any number, including decimals, or a string. (The prop is converted into a CSS
        property using the{' '}
        <a href="/material-ui/customization/spacing/">
          <code>theme.spacing()</code>
        </a>{' '}
        helper.)
      </Typography>
      <Typography className="mb-40" component="div">
        <FuseExample
          name="BasicStack.js"
          className="my-24"
          iframe={false}
          component={require('../components/stack/BasicStack.js').default}
          raw={require('!raw-loader!../components/stack/BasicStack.js')}
        />
      </Typography>
      <Typography className="text-20 mt-20 mb-10 font-700" component="h3">
        Stack vs. Grid
      </Typography>
      <Typography className="mb-40" component="div">
        <code>Stack</code> is concerned with one-dimensional layouts, while{' '}
        <a href="/material-ui/react-grid/">Grid</a> handles two-dimensional layouts. The default
        direction is <code>column</code> which stacks children vertically.
      </Typography>
      <Typography className="text-32 mt-40 mb-10 font-700" component="h2">
        Direction
      </Typography>
      <Typography className="mb-40" component="div">
        By default, Stack arranges items vertically in a column. Use the <code>direction</code> prop
        to position items horizontally in a row:
      </Typography>
      <Typography className="mb-40" component="div">
        <FuseExample
          name="DirectionStack.js"
          className="my-24"
          iframe={false}
          component={require('../components/stack/DirectionStack.js').default}
          raw={require('!raw-loader!../components/stack/DirectionStack.js')}
        />
      </Typography>
      <Typography className="text-32 mt-40 mb-10 font-700" component="h2">
        Dividers
      </Typography>
      <Typography className="mb-40" component="div">
        Use the <code>divider</code> prop to insert an element between each child. This works
        particularly well with the <a href="/material-ui/react-divider/">Divider</a> component, as
        shown below:
      </Typography>
      <Typography className="mb-40" component="div">
        <FuseExample
          name="DividerStack.js"
          className="my-24"
          iframe={false}
          component={require('../components/stack/DividerStack.js').default}
          raw={require('!raw-loader!../components/stack/DividerStack.js')}
        />
      </Typography>
      <Typography className="text-32 mt-40 mb-10 font-700" component="h2">
        Responsive values
      </Typography>
      <Typography className="mb-40" component="div">
        You can switch the <code>direction</code> or <code>spacing</code> values based on the active
        breakpoint.
      </Typography>
      <Typography className="mb-40" component="div">
        <FuseExample
          name="ResponsiveStack.js"
          className="my-24"
          iframe={false}
          component={require('../components/stack/ResponsiveStack.js').default}
          raw={require('!raw-loader!../components/stack/ResponsiveStack.js')}
        />
      </Typography>
      <Typography className="text-32 mt-40 mb-10 font-700" component="h2">
        Flexbox gap
      </Typography>
      <Typography className="mb-40" component="div">
        To use{' '}
        <a href="https://developer.mozilla.org/en-US/docs/Web/CSS/gap">
          flexbox <code>gap</code>
        </a>{' '}
        for the spacing implementation, set the <code>useFlexGap</code> prop to true.
      </Typography>
      <Typography className="mb-40" component="div">
        It removes the <a href="#limitations">known limitations</a> of the default implementation
        that uses CSS nested selector. However, CSS flexbox gap is not fully supported in some
        browsers.
      </Typography>
      <Typography className="mb-40" component="div">
        We recommend checking the{' '}
        <a href="https://caniuse.com/?search=flex%20gap">support percentage</a> before using it.
      </Typography>
      <Typography className="mb-40" component="div">
        <FuseExample
          name="FlexboxGapStack.js"
          className="my-24"
          iframe={false}
          component={require('../components/stack/FlexboxGapStack.js').default}
          raw={require('!raw-loader!../components/stack/FlexboxGapStack.js')}
        />
      </Typography>
      <Typography className="mb-40" component="div">
        To set the prop to all stack instances, create a theme with default props:
      </Typography>

      <FuseHighlight component="pre" className="language-js">
        {` 
import { ThemeProvider, createTheme } from '@mui/material/styles';
import Stack from '@mui/material/Stack';

const theme = createTheme({
  components: {
    MuiStack: {
      defaultProps: {
        useFlexGap: true,
      },
    },
  },
});

function App() {
  return (
    <ThemeProvider theme={theme}>
      <Stack>…</Stack> {/* uses flexbox gap by default */}
    </ThemeProvider>
  );
}
`}
      </FuseHighlight>
      <Typography className="text-32 mt-40 mb-10 font-700" component="h2">
        Interactive demo
      </Typography>
      <Typography className="mb-40" component="div">
        Below is an interactive demo that lets you explore the visual results of the different
        settings:
      </Typography>
      <Typography className="mb-40" component="div">
        <FuseExample
          name="InteractiveStack.js"
          className="my-24"
          iframe={false}
          component={require('../components/stack/InteractiveStack.js').default}
          raw={require('!raw-loader!../components/stack/InteractiveStack.js')}
        />
      </Typography>
      <Typography className="text-32 mt-40 mb-10 font-700" component="h2">
        System props
      </Typography>
      <Typography className="mb-40" component="div">
        As a CSS utility component, the <code>Stack</code> supports all{' '}
        <a href="/system/properties/">
          <code>system</code>
        </a>{' '}
        properties. You can use them as props directly on the component. For instance, a margin-top:
      </Typography>

      <FuseHighlight component="pre" className="language-jsx">
        {` 
<Stack mt={2}>
`}
      </FuseHighlight>
      <Typography className="text-32 mt-40 mb-10 font-700" component="h2">
        Limitations
      </Typography>
      <Typography className="text-20 mt-20 mb-10 font-700" component="h3">
        Margin on the children
      </Typography>
      <Typography className="mb-40" component="div">
        Customizing the margin on the children is not supported by default.
      </Typography>
      <Typography className="mb-40" component="div">
        For instance, the top-margin on the <code>Button</code> component below will be ignored.
      </Typography>

      <FuseHighlight component="pre" className="language-jsx">
        {` 
<Stack>
  <Button sx={{ marginTop: '30px' }}>...</Button>
</Stack>
`}
      </FuseHighlight>
      <Typography className="mb-40" component="div">
        :::success To overcome this limitation, set{' '}
        <a href="#flexbox-gap">
          <code>useFlexGap</code>
        </a>{' '}
        prop to true to switch to CSS flexbox gap implementation.
      </Typography>
      <Typography className="mb-40" component="div">
        You can learn more about this limitation by visiting this{' '}
        <a href="https://github.com/mui/material-ui/issues/33754">RFC</a>. :::
      </Typography>
      <Typography className="text-20 mt-20 mb-10 font-700" component="h3">
        white-space: nowrap
      </Typography>
      <Typography className="mb-40" component="div">
        The initial setting on flex items is <code>min-width: auto</code>. This causes a positioning
        conflict when children use <code>white-space: nowrap;</code>. You can reproduce the issue
        with:
      </Typography>

      <FuseHighlight component="pre" className="language-jsx">
        {` 
<Stack direction="row">
  <Typography noWrap>
`}
      </FuseHighlight>
      <Typography className="mb-40" component="div">
        In order for the item to stay within the container you need to set <code>min-width: 0</code>
        .
      </Typography>

      <FuseHighlight component="pre" className="language-jsx">
        {` 
<Stack direction="row" sx={{ minWidth: 0 }}>
  <Typography noWrap>
`}
      </FuseHighlight>
      <Typography className="mb-40" component="div">
        <FuseExample
          name="ZeroWidthStack.js"
          className="my-24"
          iframe={false}
          component={require('../components/stack/ZeroWidthStack.js').default}
          raw={require('!raw-loader!../components/stack/ZeroWidthStack.js')}
        />
      </Typography>
      <Typography className="text-32 mt-40 mb-10 font-700" component="h2">
        Anatomy
      </Typography>
      <Typography className="mb-40" component="div">
        The Stack component is composed of a single root <code>{`<div>`}</code> element:
      </Typography>

      <FuseHighlight component="pre" className="language-html">
        {` 
<div className="MuiStack-root">
  <!-- Stack contents -->
</div>
`}
      </FuseHighlight>
    </>
  );
}

export default StackDoc;

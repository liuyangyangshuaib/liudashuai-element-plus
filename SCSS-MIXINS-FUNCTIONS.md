# Element Plus SCSS Mixins & Functions 使用文档

本文档整理了 Element Plus 主题样式系统中常用的 SCSS Mixins 和 Functions。

## 目录

- [配置变量](#配置变量)
- [BEM 命名规范](#bem-命名规范)
- [CSS 变量相关](#css-变量相关)
- [工具类 Mixins](#工具类-mixins)
- [响应式与其他](#响应式与其他)

---

## 配置变量

位置：`packages/theme-chalk/src/mixins/config.scss`

```scss
$namespace: 'el'                    // 命名空间前缀
$common-separator: '-'              // 通用分隔符
$element-separator: '__'            // 元素分隔符
$modifier-separator: '--'           // 修饰符分隔符
$state-prefix: 'is-'                // 状态前缀
```

---

## BEM 命名规范

### @mixin b($block)

**用途**：定义 Block（块）

**示例**：
```scss
@include b(button) {
  // 生成 .el-button
  display: inline-block;
}
```

### @mixin e($element)

**用途**：定义 Element（元素）

**示例**：
```scss
@include b(button) {
  @include e(icon) {
    // 生成 .el-button__icon
    margin-right: 5px;
  }
}
```

### @mixin m($modifier)

**用途**：定义 Modifier（修饰符）

**示例**：
```scss
@include b(button) {
  @include m(primary) {
    // 生成 .el-button--primary
    background-color: blue;
  }
}
```

### @mixin when($state)

**用途**：定义状态类

**示例**：
```scss
@include b(button) {
  @include when(disabled) {
    // 生成 .el-button.is-disabled
    cursor: not-allowed;
    opacity: 0.5;
  }
}
```

### @mixin meb($modifier, $element, $block)

**用途**：在当前选择器下嵌套 Block__Element--Modifier 结构

**示例**：
```scss
@include b(form) {
  @include meb(error, label, form-item) {
    // 生成 .el-form .el-form-item__label--error
    color: red;
  }
}
```

### @function bem($block, $element, $modifier)

**用途**：生成 BEM 类名字符串

**示例**：
```scss
$class-name: bem('button', 'icon', 'large');
// 返回: 'el-button__icon--large'
```

---

## CSS 变量相关

### @function getCssVar($args...)

**用途**：获取 CSS 变量

**示例**：
```scss
color: getCssVar('color', 'primary');
// 生成: color: var(--el-color-primary);

background: getCssVar('button', 'bg-color');
// 生成: background: var(--el-button-bg-color);
```

### @function getCssVarName($args...)

**用途**：获取 CSS 变量名（不带 var()）

**示例**：
```scss
$var-name: getCssVarName('color', 'primary');
// 返回: '--el-color-primary'
```

### @function getCssVarWithDefault($args, $default)

**用途**：获取带默认值的 CSS 变量

**示例**：
```scss
color: getCssVarWithDefault(('text-color', 'primary'), #333);
// 生成: color: var(--el-text-color-primary, #333);
```

### @mixin set-css-var-value($name, $value)

**用途**：设置 CSS 变量的值

**示例**：
```scss
@include set-css-var-value(('color', 'primary'), red);
// 生成: --el-color-primary: red;
```

### @mixin set-component-css-var($name, $variables)

**用途**：批量设置组件的 CSS 变量

**示例**：
```scss
$button-vars: (
  'default': #fff,
  'hover': #f5f5f5,
  'active': #e0e0e0
);

@include set-component-css-var('button-bg', $button-vars);
// 生成:
// --el-button-bg: #fff;
// --el-button-bg-hover: #f5f5f5;
// --el-button-bg-active: #e0e0e0;
```

### @mixin css-var-from-global($var, $gVar)

**用途**：从全局 CSS 变量引用到组件变量

**示例**：
```scss
@include css-var-from-global(('button', 'text-color'), ('color', 'primary'));
// 生成: --el-button-text-color: var(--el-color-primary);
```

### @mixin set-css-color-type($colors, $type)

**用途**：设置颜色类型及其亮度变体

**示例**：
```scss
@include set-css-color-type($colors, 'primary');
// 生成:
// --el-color-primary: [base color];
// --el-color-primary-light-3: [light variant];
// --el-color-primary-light-5: [light variant];
// --el-color-primary-dark-2: [dark variant];
```

---

## 工具类 Mixins

### @mixin utils-clearfix

**用途**：清除浮动

**示例**：
```scss
.container {
  @include utils-clearfix;
}
```

### @mixin utils-ellipsis

**用途**：文本溢出省略号

**示例**：
```scss
.text {
  @include utils-ellipsis;
  // 生成:
  // overflow: hidden;
  // text-overflow: ellipsis;
  // white-space: nowrap;
}
```

### @mixin utils-vertical-center

**用途**：垂直居中对齐

**示例**：
```scss
.container {
  @include utils-vertical-center;
}
```

### @mixin utils-inline-flex-center

**用途**：Flex 居中对齐

**示例**：
```scss
.icon-wrapper {
  @include utils-inline-flex-center;
  // 生成:
  // display: inline-flex;
  // justify-content: center;
  // align-items: center;
}
```

---

## 响应式与其他

### @mixin res($key, $map)

**用途**：响应式断点

**示例**：
```scss
@include res(md) {
  // 在中等屏幕尺寸下的样式
  font-size: 14px;
}

@include res(lg) {
  // 在大屏幕尺寸下的样式
  font-size: 16px;
}
```

### @mixin scroll-bar

**用途**：自定义滚动条样式

**示例**：
```scss
.scrollable-container {
  @include scroll-bar;
}
```

### @mixin dark($block)

**用途**：定义暗黑模式样式

**示例**：
```scss
@include dark(button) {
  // 生成 html.dark .el-button
  background-color: #333;
  color: #fff;
}
```

### @mixin pseudo($pseudo)

**用途**：定义伪类样式

**示例**：
```scss
.link {
  @include pseudo(hover) {
    // 生成 .link:hover
    color: blue;
  }
}
```

### @mixin inset-input-border($color, $important)

**用途**：内嵌边框效果（使用 box-shadow）

**示例**：
```scss
.input {
  @include inset-input-border(#dcdfe6);
  // 生成: box-shadow: 0 0 0 1px #dcdfe6 inset;
  
  &:focus {
    @include inset-input-border(#409eff, true);
    // 生成: box-shadow: 0 0 0 1px #409eff inset !important;
  }
}
```

---

## 按钮专用 Mixins

### @mixin button-variant($type)

**用途**：生成按钮类型变体样式

**示例**：
```scss
@include b(button) {
  @include m(primary) {
    @include button-variant('primary');
  }
}
```

### @mixin button-plain($type)

**用途**：生成朴素按钮样式

**示例**：
```scss
@include b(button) {
  @include when(plain) {
    @include button-plain('primary');
  }
}
```

### @mixin button-size($padding-vertical, $padding-horizontal, $font-size, $border-radius)

**用途**：定义按钮尺寸

**示例**：
```scss
@include b(button) {
  @include m(large) {
    @include button-size(12px, 20px, 16px, 4px);
  }
}
```

---

## 辅助 Functions

### @function joinVarName($list)

**用途**：连接变量名列表

**示例**：
```scss
$var: joinVarName(('button', 'text', 'color'));
// 返回: '--el-button-text-color'
```

### @function selectorToString($selector)

**用途**：将选择器转换为字符串

### @function containsModifier($selector)

**用途**：检查选择器是否包含修饰符

### @function containWhenFlag($selector)

**用途**：检查选择器是否包含状态标志

### @function containPseudoClass($selector)

**用途**：检查选择器是否包含伪类

---

## 使用示例

### 完整组件样式示例

```scss
@use './mixins/mixins' as *;
@use './common/var' as *;

@include b(card) {
  background: getCssVar('bg-color');
  border: 1px solid getCssVar('border-color');
  
  @include e(header) {
    padding: 16px;
    border-bottom: 1px solid getCssVar('border-color');
    
    @include utils-ellipsis;
  }
  
  @include e(body) {
    padding: 16px;
  }
  
  @include m(shadow) {
    box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
  }
  
  @include when(disabled) {
    opacity: 0.5;
    cursor: not-allowed;
  }
  
  @include res(md) {
    max-width: 600px;
  }
}

@include dark(card) {
  background: #1a1a1a;
  border-color: #333;
}
```

---

## 注意事项

1. **命名空间**：所有类名都会自动添加 `el-` 前缀
2. **BEM 嵌套**：`e()` 和 `m()` 必须在 `b()` 内部使用
3. **CSS 变量**：优先使用 `getCssVar()` 而不是硬编码值，以支持主题定制
4. **响应式**：使用 `res()` mixin 而不是直接写 media query
5. **暗黑模式**：使用 `dark()` mixin 定义暗黑模式样式

---

## 相关文件

- 配置：`packages/theme-chalk/src/mixins/config.scss`
- 核心 Mixins：`packages/theme-chalk/src/mixins/mixins.scss`
- 函数：`packages/theme-chalk/src/mixins/function.scss`
- CSS 变量：`packages/theme-chalk/src/mixins/_var.scss`
- 工具类：`packages/theme-chalk/src/mixins/utils.scss`
- 按钮：`packages/theme-chalk/src/mixins/_button.scss`

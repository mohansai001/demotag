# Reusable Components Library

This directory contains a collection of reusable React components that follow consistent design patterns and can be used throughout the application.

## 🎯 Design Principles

- **Consistency**: All components follow the same API patterns
- **Flexibility**: Configurable through props with sensible defaults
- **Accessibility**: Built with accessibility in mind
- **Responsiveness**: Mobile-first responsive design
- **Composability**: Components can be combined to create complex UIs

## 📚 Components Overview

### Button Component

A versatile button component with multiple variants, sizes, and states.

```jsx
import { Button } from './common';

// Basic usage
<Button>Click me</Button>

// With variants
<Button variant="primary">Primary</Button>
<Button variant="secondary">Secondary</Button>
<Button variant="success">Success</Button>
<Button variant="danger">Danger</Button>
<Button variant="warning">Warning</Button>
<Button variant="info">Info</Button>

// With sizes
<Button size="small">Small</Button>
<Button size="medium">Medium</Button>
<Button size="large">Large</Button>

// With icons
<Button icon="fas fa-plus">Add Item</Button>
<Button icon="fas fa-save" variant="success">Save</Button>

// With loading state
<Button loading>Processing...</Button>

// Disabled state
<Button disabled>Disabled</Button>
```

**Props:**
- `variant`: 'primary' | 'secondary' | 'success' | 'danger' | 'warning' | 'info' | 'light' | 'dark' | 'outline-primary'
- `size`: 'small' | 'medium' | 'large'
- `disabled`: boolean
- `loading`: boolean
- `icon`: string (FontAwesome class)
- `onClick`: function
- `type`: 'button' | 'submit' | 'reset'

### Card Component

A flexible card component with header, body, and footer sections.

```jsx
import { Card } from './common';

// Basic usage
<Card>
  <Card.Header>
    <Card.Title>Card Title</Card.Title>
  </Card.Header>
  <Card.Body>
    <p>Card content goes here</p>
  </Card.Body>
  <Card.Footer>
    <Button variant="primary">Action</Button>
  </Card.Footer>
</Card>

// With variants
<Card variant="primary">Primary Card</Card>
<Card variant="success">Success Card</Card>
<Card variant="danger">Danger Card</Card>

// With hover effects
<Card hover>Hover me</Card>

// With different shadows
<Card shadow="small">Small shadow</Card>
<Card shadow="medium">Medium shadow</Card>
<Card shadow="large">Large shadow</Card>

// With different padding
<Card padding="small">Small padding</Card>
<Card padding="large">Large padding</Card>
```

**Props:**
- `variant`: 'default' | 'primary' | 'success' | 'warning' | 'danger' | 'info' | 'dark'
- `hover`: boolean
- `shadow`: 'none' | 'small' | 'medium' | 'large'
- `padding`: 'none' | 'small' | 'medium' | 'large'

### Input Component

A comprehensive input component with validation and icons.

```jsx
import { Input } from './common';

// Basic usage
<Input 
  label="Email"
  type="email"
  placeholder="Enter your email"
  value={email}
  onChange={(e) => setEmail(e.target.value)}
/>

// With icon
<Input 
  label="Username"
  icon="fas fa-user"
  value={username}
  onChange={(e) => setUsername(e.target.value)}
/>

// With validation
<Input 
  label="Password"
  type="password"
  error={passwordError}
  required
  value={password}
  onChange={(e) => setPassword(e.target.value)}
/>

// Different sizes
<Input size="small" placeholder="Small input" />
<Input size="medium" placeholder="Medium input" />
<Input size="large" placeholder="Large input" />

// Different variants
<Input variant="primary" />
<Input variant="success" />
<Input variant="danger" />
```

**Props:**
- `type`: 'text' | 'email' | 'password' | 'number' | etc.
- `label`: string
- `placeholder`: string
- `value`: string
- `onChange`: function
- `error`: string
- `disabled`: boolean
- `required`: boolean
- `size`: 'small' | 'medium' | 'large'
- `variant`: 'default' | 'primary' | 'success' | 'warning' | 'danger'
- `icon`: string (FontAwesome class)

### Modal Component

A flexible modal component with multiple sizes and variants.

```jsx
import { Modal } from './common';

const [isOpen, setIsOpen] = useState(false);

<Modal
  isOpen={isOpen}
  onClose={() => setIsOpen(false)}
  title="Modal Title"
  size="medium"
>
  <Modal.Body>
    <p>Modal content goes here</p>
  </Modal.Body>
  <Modal.Footer>
    <Button variant="primary">Save</Button>
    <Button variant="secondary" onClick={() => setIsOpen(false)}>
      Cancel
    </Button>
  </Modal.Footer>
</Modal>

// Different sizes
<Modal size="small">Small Modal</Modal>
<Modal size="medium">Medium Modal</Modal>
<Modal size="large">Large Modal</Modal>
<Modal size="extra-large">Extra Large Modal</Modal>
<Modal size="full">Full Screen Modal</Modal>

// Different variants
<Modal variant="primary">Primary Modal</Modal>
<Modal variant="success">Success Modal</Modal>
<Modal variant="danger">Danger Modal</Modal>

// Configuration options
<Modal
  closeOnOverlayClick={false}
  closeOnEsc={false}
  showCloseButton={false}
>
  Custom Modal
</Modal>
```

**Props:**
- `isOpen`: boolean
- `onClose`: function
- `title`: string
- `size`: 'small' | 'medium' | 'large' | 'extra-large' | 'full'
- `variant`: 'default' | 'primary' | 'success' | 'warning' | 'danger' | 'info' | 'dark'
- `closeOnOverlayClick`: boolean
- `closeOnEsc`: boolean
- `showCloseButton`: boolean

### LoadingSpinner Component

A customizable loading spinner with different styles and sizes.

```jsx
import { LoadingSpinner } from './common';

// Basic usage
<LoadingSpinner />

// With text
<LoadingSpinner text="Loading..." />

// Different sizes
<LoadingSpinner size="small" />
<LoadingSpinner size="medium" />
<LoadingSpinner size="large" />
<LoadingSpinner size="extra-large" />

// Different variants
<LoadingSpinner variant="primary" />
<LoadingSpinner variant="success" />
<LoadingSpinner variant="danger" />

// As overlay
<LoadingSpinner overlay text="Processing..." />
```

**Props:**
- `size`: 'small' | 'medium' | 'large' | 'extra-large'
- `variant`: 'primary' | 'secondary' | 'success' | 'danger' | 'warning' | 'info' | 'light' | 'dark'
- `text`: string
- `overlay`: boolean

## 🎨 Usage Examples

### Complete Form Example

```jsx
import { Button, Card, Input, Modal } from './common';

const UserForm = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: ''
  });
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleInputChange = (field) => (e) => {
    setFormData(prev => ({
      ...prev,
      [field]: e.target.value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    // Handle form submission
    setIsSubmitting(false);
  };

  return (
    <Card>
      <Card.Header>
        <Card.Title>User Registration</Card.Title>
      </Card.Header>
      <Card.Body>
        <form onSubmit={handleSubmit}>
          <Input
            label="Full Name"
            placeholder="Enter your full name"
            value={formData.name}
            onChange={handleInputChange('name')}
            error={errors.name}
            required
            icon="fas fa-user"
          />
          
          <Input
            label="Email Address"
            type="email"
            placeholder="Enter your email"
            value={formData.email}
            onChange={handleInputChange('email')}
            error={errors.email}
            required
            icon="fas fa-envelope"
          />
          
          <Input
            label="Password"
            type="password"
            placeholder="Enter your password"
            value={formData.password}
            onChange={handleInputChange('password')}
            error={errors.password}
            required
            icon="fas fa-lock"
          />
        </form>
      </Card.Body>
      <Card.Footer>
        <Button
          type="submit"
          variant="primary"
          loading={isSubmitting}
          icon="fas fa-save"
        >
          Register
        </Button>
        <Button variant="secondary">
          Cancel
        </Button>
      </Card.Footer>
    </Card>
  );
};
```

### Dashboard Cards Example

```jsx
import { Card, Button } from './common';

const DashboardStats = ({ stats }) => {
  return (
    <div className="dashboard-grid">
      <Card hover shadow="medium" variant="primary">
        <Card.Body>
          <div className="stat-item">
            <i className="fas fa-users stat-icon"></i>
            <div>
              <h3>{stats.totalUsers}</h3>
              <p>Total Users</p>
            </div>
          </div>
        </Card.Body>
      </Card>

      <Card hover shadow="medium" variant="success">
        <Card.Body>
          <div className="stat-item">
            <i className="fas fa-check-circle stat-icon"></i>
            <div>
              <h3>{stats.completedTasks}</h3>
              <p>Completed Tasks</p>
            </div>
          </div>
        </Card.Body>
      </Card>

      <Card hover shadow="medium" variant="warning">
        <Card.Body>
          <div className="stat-item">
            <i className="fas fa-clock stat-icon"></i>
            <div>
              <h3>{stats.pendingTasks}</h3>
              <p>Pending Tasks</p>
            </div>
          </div>
        </Card.Body>
      </Card>
    </div>
  );
};
```

## 🔧 Customization

### Adding New Variants

To add new variants to any component, update the CSS file:

```css
/* In Button.css */
.btn-custom {
  background-color: #your-color;
  color: white;
}

.btn-custom:hover:not(:disabled) {
  background-color: #your-darker-color;
}
```

### Creating Composite Components

Combine basic components to create more complex ones:

```jsx
const SearchableList = ({ items, onSearch, onAdd }) => {
  return (
    <Card>
      <Card.Header>
        <Input
          placeholder="Search items..."
          icon="fas fa-search"
          onChange={onSearch}
        />
        <Button variant="primary" icon="fas fa-plus" onClick={onAdd}>
          Add Item
        </Button>
      </Card.Header>
      <Card.Body>
        {items.map(item => (
          <Card key={item.id} hover>
            <Card.Body>{item.name}</Card.Body>
          </Card>
        ))}
      </Card.Body>
    </Card>
  );
};
```

## 🎯 Best Practices

1. **Always use the common components** instead of creating custom ones
2. **Leverage composition** - combine simple components to create complex UIs
3. **Use consistent spacing** - utilize the padding and margin props
4. **Follow the variant system** - use semantic variants (success, danger, etc.)
5. **Provide meaningful labels** - always add labels to form inputs
6. **Handle loading states** - show loading spinners during async operations
7. **Use icons consistently** - stick to FontAwesome classes
8. **Test responsiveness** - ensure components work on all screen sizes

## 📱 Responsive Design

All components are built with mobile-first responsive design:

- **Small screens** (< 768px): Optimized for mobile devices
- **Medium screens** (768px - 1024px): Tablet-friendly layouts
- **Large screens** (> 1024px): Desktop optimizations

## ♿ Accessibility

Components include accessibility features:

- **Keyboard navigation** - All interactive elements are keyboard accessible
- **ARIA labels** - Screen reader friendly
- **Focus management** - Proper focus indicators
- **Color contrast** - WCAG compliant color combinations
- **Semantic HTML** - Proper HTML structure

## 🔄 Migration Guide

When migrating from old components to new ones:

1. **Replace HTML elements** with React components
2. **Update class names** to use props
3. **Convert inline styles** to component props
4. **Consolidate similar components** using variants
5. **Test thoroughly** to ensure functionality is preserved

Example migration:

```jsx
// Old way
<button className="btn btn-primary" onClick={handleClick}>
  <i className="fas fa-plus"></i> Add Item
</button>

// New way
<Button variant="primary" icon="fas fa-plus" onClick={handleClick}>
  Add Item
</Button>
```

This component library provides a solid foundation for building consistent, accessible, and maintainable user interfaces throughout the application.
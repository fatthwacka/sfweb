# Modal Structure Fix

The image generator modal needs a simple structure:

```jsx
<Dialog>
  <DialogContent>
    <DialogHeader>...</DialogHeader>
    
    <Tabs>
      <TabsList>
        <TabsTrigger value="ai">AI</TabsTrigger>
        <TabsTrigger value="unsplash">Unsplash</TabsTrigger>
      </TabsList>
      
      <TabsContent value="ai">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div>AI Configuration Form</div>
          <div>AI Preview Panel</div>
        </div>
      </TabsContent>
      
      <TabsContent value="unsplash">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div>Unsplash Configuration Form</div>
          <div>Unsplash Preview Panel</div>
        </div>
      </TabsContent>
    </Tabs>
    
  </DialogContent>
</Dialog>
```

This avoids the complex nesting issues we're having.
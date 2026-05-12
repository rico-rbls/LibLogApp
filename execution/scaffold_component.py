import sys
import os

def scaffold(component_name, app_type):
    """
    Scaffolds a React component in the correct workspace directory 
    while forcing basic CCC branding constraints.
    """
    
    if app_type not in ["desktop", "mobile"]:
        print("❌ Error: App type must be 'desktop' or 'mobile'")
        sys.exit(1)

    # Resolve Monorepo path
    if app_type == "desktop":
        base_dir = "apps/desktop/liblog-desktop/src/components"
    else:
        base_dir = "apps/mobile/src/components"
    
    file_path = os.path.join(base_dir, f"{component_name}.tsx")

    # Desktop Template (Vite + Tailwind)
    desktop_template = f"""import React from 'react';
import {{ useQuery, useMutation, useQueryClient }} from '@tanstack/react-query';
import {{ supabase }} from '@/services/supabase';
import {{ AlertCircle }} from 'lucide-react';

interface {component_name}Props {{
  // Define props here
}}

export const {component_name}: React.FC<{component_name}Props> = (props) => {{
  const queryClient = useQueryClient();

  return (
    <div className="bg-white rounded-lg shadow-sm border-l-4 border-[#652D90] p-6">
      <div className="flex items-center gap-2 mb-4">
        <AlertCircle className="w-6 h-6 text-[#652D90]" />
        <h2 className="text-xl font-bold text-gray-900">{component_name}</h2>
      </div>
      
      <div className="text-gray-600">
        <p>Component generated via CCC Scaffolder.</p>
        {/* Implementation goes here */}
      </div>
    </div>
  );
}};
"""

    # Mobile Template (Expo + StyleSheet)
    mobile_template = f"""import React from 'react';
import {{ View, Text, StyleSheet }} from 'react-native';
// import {{ supabase }} from '@/services/supabase'; // Shared logic

interface {component_name}Props {{
  // Define props here
}}

export const {component_name} = (props: {component_name}Props) => {{
  return (
    <View style={{styles.container}}>
      <Text style={{styles.title}}>{component_name}</Text>
    </View>
  );
}};

const styles = StyleSheet.create({{
  container: {{
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderLeftWidth: 4,
    borderLeftColor: '#652D90',
    borderRadius: 8,
    marginVertical: 8,
  }},
  title: {{
    fontSize: 20,
    fontWeight: 'bold',
    color: '#652D90',
  }},
}});
"""

    # Ensure directory exists
    os.makedirs(base_dir, exist_ok=True)

    # Write the file
    template = desktop_template if app_type == "desktop" else mobile_template
    
    if os.path.exists(file_path):
        print(f"⚠️ Warning: {file_path} already exists. Skipping scaffold.")
    else:
        with open(file_path, "w") as f:
            f.write(template)
        print(f"✅ Success: {component_name} scaffolded at {file_path}")

if __name__ == "__main__":
    if len(sys.argv) < 3:
        print("Usage: python scaffold_component.py \"<ComponentName>\" \"<desktop|mobile>\"")
        sys.exit(1)
    
    scaffold(sys.argv[1], sys.argv[2])
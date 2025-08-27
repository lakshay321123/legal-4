- name: If build FAILED → Run AI autofix
  if: steps.build.outcome != 'success'
  run: |
    echo "Build failed. Running AI autofix..."
    node scripts/ai-fix.mjs build.log

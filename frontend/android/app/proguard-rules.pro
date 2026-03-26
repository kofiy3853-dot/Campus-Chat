# Capacitor specific rules
-keep class com.getcapacitor.** { *; }
-keep  class * extends com.getcapacitor.Plugin
-keep  class * extends com.getcapacitor.BridgeActivity

# Firebase specific rules
-keep class com.google.firebase.** { *; }
-keep class com.google.android.gms.** { *; }

# Preserve line numbers for better crash reports
-keepattributes SourceFile,LineNumberTable
-renamesourcefileattribute SourceFile

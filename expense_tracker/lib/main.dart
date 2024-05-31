import 'package:expense_tracker/expenses.dart';
import 'package:flutter/material.dart';

var myColorScheme =
    ColorScheme.fromSeed(seedColor: const Color.fromARGB(255, 96, 59, 181));

var myDarkColorScheme = ColorScheme.fromSeed(
    brightness: Brightness.dark,
    seedColor: const Color.fromARGB(255, 5, 99, 125));

void main() {
  runApp(MaterialApp(
    darkTheme: ThemeData.dark(useMaterial3: true).copyWith(
      colorScheme: myDarkColorScheme,
      cardTheme: const CardTheme().copyWith(
          color: myDarkColorScheme.secondaryContainer,
          margin: const EdgeInsets.symmetric(horizontal: 16, vertical: 8)),
      elevatedButtonTheme: ElevatedButtonThemeData(
          style: ElevatedButton.styleFrom(
              backgroundColor: myDarkColorScheme.primaryContainer,
              foregroundColor: myDarkColorScheme.onPrimaryContainer)),
    ),
    theme: ThemeData(
      useMaterial3: true,
    ).copyWith(
        colorScheme: myColorScheme,
        appBarTheme: const AppBarTheme().copyWith(
          backgroundColor: myColorScheme.onPrimaryContainer,
          foregroundColor: myColorScheme.primaryContainer,
        ),
        cardTheme: const CardTheme().copyWith(
            color: myColorScheme.secondaryContainer,
            margin: const EdgeInsets.symmetric(horizontal: 16, vertical: 8)),
        elevatedButtonTheme: ElevatedButtonThemeData(
            style: ElevatedButton.styleFrom(
                backgroundColor: myColorScheme.primaryContainer)),
        textTheme: ThemeData().textTheme.copyWith(
            titleLarge: TextStyle(
                fontWeight: FontWeight.bold,
                color: myColorScheme.onSecondaryContainer,
                fontSize: 16))),
    themeMode: ThemeMode.dark,
    home: const Expenses(),
  ));
}

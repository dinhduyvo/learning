import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

class QuestionsSummary extends StatelessWidget {
  const QuestionsSummary(this.summaryData, {super.key});

  final List<Map<String, Object>> summaryData;

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      height: 400,
      child: SingleChildScrollView(
        child: Column(
          children: summaryData.map((data) {
            return Row(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Container(
                    height: 30,
                    width: 30,
                    decoration: BoxDecoration(
                      borderRadius: BorderRadius.circular(50),
                      color: data['user_answer'] == data['correct_answer'] ? Colors.green : const Color.fromARGB(255, 207, 75, 119),
                    ),
                    child: Center(
                        child: Text(
                            ((data['question_index'] as int) + 1).toString()))),
                Expanded(
                  child: Padding(
                    padding: const EdgeInsets.fromLTRB(15, 0, 15, 10),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(data['question'] as String, style: GoogleFonts.lato(
                          color: Colors.white,
                          fontWeight: FontWeight.bold,
                        ),),
                        const SizedBox(
                          height: 5,
                        ),
                        Text(data['user_answer'] as String, style: GoogleFonts.lato(
                          color: Colors.purpleAccent
                        ),),
                        Text(data['correct_answer'] as String,style: GoogleFonts.lato(
                          color: Colors.blueAccent
                        ),),
                      ],
                    ),
                  ),
                )
              ],
            );
          }).toList(),
        ),
      ),
    );
  }
}
